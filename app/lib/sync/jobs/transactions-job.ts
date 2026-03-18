/**
 * Job 5 — Transactions  (Phase 1: store only — not used by scoring engine)
 *
 * `order.transactions` is a direct list in the Shopify API (not a paginated
 * connection), so transactions appear as an inlined array within each Order
 * JSONL record — no __parentId on individual transactions.
 */
import db from "../../../db.server";
import { submitBulkOperation, waitForBulkOperation, downloadJsonl } from "../../shopify/bulk-client";
import { TRANSACTIONS_BULK_QUERY } from "../../shopify/queries/transactions-bulk";
import { parseJsonlLines, groupByParentId, parseMoney, parseDate } from "../jsonl-parser";

type AdminClient = {
  graphql: (query: string, options?: { variables?: Record<string, unknown> }) => Promise<Response>;
};

export async function runTransactionsJob(
  admin: AdminClient,
  shopDomain: string,
  syncJobId: string,
): Promise<void> {
  const operationId = await submitBulkOperation(admin, TRANSACTIONS_BULK_QUERY);

  await db.syncJob.update({
    where: { id: syncJobId },
    data: { bulkOperationId: operationId },
  });

  const result = await waitForBulkOperation(admin, operationId);

  if (!result.url) {
    await db.syncJob.update({ where: { id: syncJobId }, data: { recordsProcessed: 0 } });
    return;
  }

  const raw = await downloadJsonl(result.url);
  const records = parseJsonlLines(raw);
  const byParent = groupByParentId(records);

  // Order records are at the top level (no __parentId)
  const orderRecords = byParent.get("") ?? [];
  let processedCount = 0;

  for (const order of orderRecords) {
    // Transactions are inlined as an array on the order record
    const transactions: Array<Record<string, unknown>> = order.transactions ?? [];

    for (const tx of transactions) {
      const txId = tx.id as string | undefined;
      if (!txId) continue;

      // Only upsert if the parent order exists in our DB
      const orderExists = await db.order.findUnique({
        where: { shopDomain_orderGid: { shopDomain, orderGid: order.id } },
        select: { id: true },
      });

      if (!orderExists) continue;

      const amountSet = tx.amountSet as Record<string, unknown> | null ?? null;
      const shopMoney = amountSet?.shopMoney as Record<string, unknown> | null ?? null;
      const parentTx = tx.parentTransaction as Record<string, unknown> | null ?? null;

      await db.transaction.upsert({
        where: {
          shopDomain_transactionGid: {
            shopDomain,
            transactionGid: txId,
          },
        },
        update: {
          orderGid: order.id,
          parentTransactionGid: (parentTx?.id as string) ?? null,
          kind: (tx.kind as string) ?? null,
          status: (tx.status as string) ?? null,
          gateway: (tx.gateway as string) ?? null,
          amount: parseMoney(shopMoney?.amount),
          currencyCode: (shopMoney?.currencyCode as string) ?? null,
          processedAtShopify: parseDate(tx.processedAt),
        },
        create: {
          shopDomain,
          transactionGid: txId,
          orderGid: order.id,
          parentTransactionGid: (parentTx?.id as string) ?? null,
          kind: (tx.kind as string) ?? null,
          status: (tx.status as string) ?? null,
          gateway: (tx.gateway as string) ?? null,
          amount: parseMoney(shopMoney?.amount),
          currencyCode: (shopMoney?.currencyCode as string) ?? null,
          processedAtShopify: parseDate(tx.processedAt),
        },
      });

      processedCount++;
    }
  }

  await db.syncJob.update({
    where: { id: syncJobId },
    data: { recordsProcessed: processedCount },
  });
}
