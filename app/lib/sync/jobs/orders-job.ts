import db from "../../../db.server";
import { submitBulkOperation, waitForBulkOperation, downloadJsonl } from "../../shopify/bulk-client";
import { buildOrdersBulkQuery, resolveSyncSinceDate } from "../../shopify/queries/orders-bulk";
import { parseJsonlLines, groupByParentId, parseMoney, parseDate } from "../jsonl-parser";

type AdminClient = {
  graphql: (query: string, options?: { variables?: Record<string, unknown> }) => Promise<Response>;
};

export async function runOrdersJob(
  admin: AdminClient,
  shopDomain: string,
  syncJobId: string,
  syncRangeDays: number,
  hasAllOrdersScope: boolean,
): Promise<void> {
  const { sinceDate } = resolveSyncSinceDate(syncRangeDays, hasAllOrdersScope);
  const query = buildOrdersBulkQuery(sinceDate);

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

  const orderRecords = byParent.get("") ?? [];
  let processedCount = 0;

  for (const order of orderRecords) {
    if (!order.id) continue;
    const totalPrice = parseMoney(
      order.totalPriceSet?.shopMoney?.amount,
    );
    const subtotal = parseMoney(
      order.subtotalPriceSet?.shopMoney?.amount,
    );
    const currency =
      order.totalPriceSet?.shopMoney?.currencyCode ?? null;

    await db.order.upsert({
      where: { shopDomain_orderGid: { shopDomain, orderGid: order.id } },
      update: {
        name: order.name ?? null,
        email: order.email ?? null,
        financialStatus: order.displayFinancialStatus ?? null,
        fulfillmentStatus: order.displayFulfillmentStatus ?? null,
        totalPriceAmount: totalPrice,
        subtotalAmount: subtotal,
        currencyCode: currency,
        isTest: order.test ?? false,
        processedAt: parseDate(order.processedAt),
        cancelledAtShopify: parseDate(order.cancelledAt),
        closedAt: parseDate(order.closedAt),
        updatedAtShopify: parseDate(order.updatedAt),
      },
      create: {
        shopDomain,
        orderGid: order.id,
        name: order.name ?? null,
        email: order.email ?? null,
        financialStatus: order.displayFinancialStatus ?? null,
        fulfillmentStatus: order.displayFulfillmentStatus ?? null,
        totalPriceAmount: totalPrice,
        subtotalAmount: subtotal,
        currencyCode: currency,
        isTest: order.test ?? false,
        processedAt: parseDate(order.processedAt),
        cancelledAtShopify: parseDate(order.cancelledAt),
        closedAt: parseDate(order.closedAt),
        createdAtShopify: parseDate(order.createdAt),
        updatedAtShopify: parseDate(order.updatedAt),
      },
    });

    processedCount++;

    // Line items are child records of this order
    const lineItems = byParent.get(order.id) ?? [];

    for (const li of lineItems) {
      const price = parseMoney(li.originalUnitPriceSet?.shopMoney?.amount) ?? 0;
      const discount = parseMoney(li.discountedTotalSet?.shopMoney?.amount);
      const variantGid: string | null = li.variant?.id ?? null;

      await db.orderLineItem.upsert({
        where: { shopDomain_lineItemGid: { shopDomain, lineItemGid: li.id } },
        update: {
          orderGid: order.id,
          variantGid,
          title: li.title ?? null,
          variantTitle: li.variantTitle ?? null,
          quantity: li.quantity ?? 0,
          price,
          totalDiscountAmount: discount,
          sku: li.sku ?? null,
          isGiftCard: li.isGiftCard ?? null,
          requiresShipping: li.requiresShipping ?? null,
        },
        create: {
          shopDomain,
          orderGid: order.id,
          lineItemGid: li.id,
          variantGid,
          title: li.title ?? null,
          variantTitle: li.variantTitle ?? null,
          quantity: li.quantity ?? 0,
          price,
          totalDiscountAmount: discount,
          sku: li.sku ?? null,
          isGiftCard: li.isGiftCard ?? null,
          requiresShipping: li.requiresShipping ?? null,
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
