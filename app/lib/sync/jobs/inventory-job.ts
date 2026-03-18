import db from "../../../db.server";
import { submitBulkOperation, waitForBulkOperation, downloadJsonl } from "../../shopify/bulk-client";
import { INVENTORY_BULK_QUERY } from "../../shopify/queries/inventory-bulk";
import { parseJsonlLines, groupByParentId, parseMoney, parseDate } from "../jsonl-parser";

type AdminClient = {
  graphql: (query: string, options?: { variables?: Record<string, unknown> }) => Promise<Response>;
};

export async function runInventoryJob(
  admin: AdminClient,
  shopDomain: string,
  syncJobId: string,
): Promise<void> {
  const operationId = await submitBulkOperation(admin, INVENTORY_BULK_QUERY);

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

  const inventoryItemRecords = byParent.get("") ?? [];
  let processedCount = 0;

  for (const item of inventoryItemRecords) {
    if (!item.id) continue;
    const unitCostAmount = parseMoney(item.unitCost?.amount);
    const hasCostData = unitCostAmount != null && unitCostAmount > 0;

    await db.inventoryItem.upsert({
      where: {
        shopDomain_inventoryItemGid: {
          shopDomain,
          inventoryItemGid: item.id,
        },
      },
      update: {
        sku: item.sku ?? null,
        unitCostAmount,
        unitCostCurrencyCode: item.unitCost?.currencyCode ?? null,
        hasCostData,
        tracked: item.tracked ?? false,
        requiresShipping: item.requiresShipping ?? null,
      },
      create: {
        shopDomain,
        inventoryItemGid: item.id,
        sku: item.sku ?? null,
        unitCostAmount,
        unitCostCurrencyCode: item.unitCost?.currencyCode ?? null,
        hasCostData,
        tracked: item.tracked ?? false,
        requiresShipping: item.requiresShipping ?? null,
      },
    });

    processedCount++;

    // Inventory levels are children of this item
    const levels = byParent.get(item.id) ?? [];

    for (const level of levels) {
      const locationGid: string = level.location?.id ?? "";
      if (!locationGid) continue;

      // Parse the quantities array [{ name, quantity }]
      const quantities: Array<{ name: string; quantity: number }> =
        level.quantities ?? [];
      const qty = (name: string) =>
        quantities.find((q) => q.name === name)?.quantity ?? null;

      await db.inventoryLevel.upsert({
        where: {
          shopDomain_inventoryItemGid_locationGid: {
            shopDomain,
            inventoryItemGid: item.id,
            locationGid,
          },
        },
        update: {
          available: qty("available") ?? 0,
          onHand: qty("on_hand"),
          committed: qty("committed"),
          reserved: qty("reserved"),
          incoming: qty("incoming"),
          updatedAtShopify: parseDate(level.updatedAt),
        },
        create: {
          shopDomain,
          inventoryItemGid: item.id,
          locationGid,
          available: qty("available") ?? 0,
          onHand: qty("on_hand"),
          committed: qty("committed"),
          reserved: qty("reserved"),
          incoming: qty("incoming"),
          updatedAtShopify: parseDate(level.updatedAt),
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
