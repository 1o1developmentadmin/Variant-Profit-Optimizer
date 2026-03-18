/**
 * Job 3 — Refunds & Refund Line Items
 *
 * ⚠️  This is a SEPARATE bulk operation from the orders job (Job 2).
 *     Mixing refunds into the orders batch causes JSONL __parentId ambiguity.
 *
 * JSONL flattening:
 *   Level 0  Order           { id, ... }
 *   Level 1  Refund          { id, ..., __parentId: orderGid }
 *   Level 2  RefundLineItem  { id, quantity, ..., lineItem: { id, variant: { id } },
 *                              __parentId: refundGid }
 *
 * The `lineItem` field on a RefundLineItem is a non-connection sub-object,
 * so it is inlined into the RefundLineItem record — NOT a separate JSONL line.
 * We extract orderLineItemGid and variantGid directly from it.
 */
import db from "../../../db.server";
import { submitBulkOperation, waitForBulkOperation, downloadJsonl } from "../../shopify/bulk-client";
import { buildRefundsBulkQuery } from "../../shopify/queries/refunds-bulk";
import { parseJsonlLines, groupByParentId, parseMoney, parseDate } from "../jsonl-parser";

type AdminClient = {
  graphql: (query: string, options?: { variables?: Record<string, unknown> }) => Promise<Response>;
};

export async function runRefundsJob(
  admin: AdminClient,
  shopDomain: string,
  syncJobId: string,
  syncRangeDays: number,
  hasAllOrdersScope: boolean,
): Promise<void> {
  // Use the same date window as the orders job
  let days = syncRangeDays;
  if (!hasAllOrdersScope && days > 60) days = 60;

  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceDate = since.toISOString().split("T")[0];

  const query = buildRefundsBulkQuery(sinceDate);
  const operationId = await submitBulkOperation(admin, query);

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

  // Level 0: order records (no __parentId — but we only care about them as keys)
  // Level 1: refunds with __parentId = orderGid
  // Level 2: refundLineItems with __parentId = refundGid

  let processedCount = 0;

  // Iterate all records to find refunds (they have a __parentId pointing to an order)
  for (const record of records) {
    if (!record.__parentId) continue; // skip order-level records

    const parentId = record.__parentId;

    // Determine if this record is a Refund or a RefundLineItem
    if (record.id?.includes("gid://shopify/Refund/")) {
      // This is a refund record; __parentId is an orderGid
      const orderGid = parentId;
      const currency = record.totalRefundedSet?.shopMoney?.currencyCode ?? null;

      // Only upsert if the parent order exists in our DB
      const orderExists = await db.order.findUnique({
        where: { shopDomain_orderGid: { shopDomain, orderGid } },
        select: { id: true },
      });

      if (!orderExists) continue;

      await db.refund.upsert({
        where: { shopDomain_refundGid: { shopDomain, refundGid: record.id } },
        update: {
          orderGid,
          note: record.note ?? null,
          totalRefundedAmount: parseMoney(record.totalRefundedSet?.shopMoney?.amount),
          currencyCode: currency,
          processedAt: parseDate(record.processedAt),
          createdAtShopify: parseDate(record.createdAt),
        },
        create: {
          shopDomain,
          refundGid: record.id,
          orderGid,
          note: record.note ?? null,
          totalRefundedAmount: parseMoney(record.totalRefundedSet?.shopMoney?.amount),
          currencyCode: currency,
          createdAtShopify: parseDate(record.createdAt),
          processedAt: parseDate(record.processedAt),
        },
      });

      processedCount++;
    } else if (record.id?.includes("gid://shopify/RefundLineItem/")) {
      // This is a refund line item; __parentId is a refundGid
      const refundGid = parentId;

      // Extract orderLineItemGid and variantGid from the inlined `lineItem` sub-object
      const orderLineItemGid: string | null = record.lineItem?.id ?? null;
      const variantGid: string | null = record.lineItem?.variant?.id ?? null;

      // Only upsert if the parent refund exists
      const refundExists = await db.refund.findUnique({
        where: { shopDomain_refundGid: { shopDomain, refundGid } },
        select: { id: true },
      });

      if (!refundExists) continue;

      await db.refundLineItem.upsert({
        where: {
          shopDomain_refundLineItemGid: {
            shopDomain,
            refundLineItemGid: record.id,
          },
        },
        update: {
          refundGid,
          orderLineItemGid,
          variantGid,
          quantity: record.quantity ?? 0,
          subtotalAmount: parseMoney(record.subtotalSet?.shopMoney?.amount),
          totalTaxAmount: parseMoney(record.totalTaxSet?.shopMoney?.amount),
          restockType: record.restockType ?? null,
        },
        create: {
          shopDomain,
          refundLineItemGid: record.id,
          refundGid,
          orderLineItemGid,
          variantGid,
          quantity: record.quantity ?? 0,
          subtotalAmount: parseMoney(record.subtotalSet?.shopMoney?.amount),
          totalTaxAmount: parseMoney(record.totalTaxSet?.shopMoney?.amount),
          restockType: record.restockType ?? null,
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
