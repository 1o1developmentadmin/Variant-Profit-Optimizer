import db from "../../../db.server";
import { submitBulkOperation, waitForBulkOperation, downloadJsonl } from "../../shopify/bulk-client";
import { PRODUCTS_BULK_QUERY } from "../../shopify/queries/products-bulk";
import { parseJsonlLines, groupByParentId, parseMoney, parseDate } from "../jsonl-parser";

type AdminClient = {
  graphql: (query: string, options?: { variables?: Record<string, unknown> }) => Promise<Response>;
};

export async function runProductsJob(
  admin: AdminClient,
  shopDomain: string,
  syncJobId: string,
): Promise<void> {
  // 1. Submit bulk operation
  const operationId = await submitBulkOperation(admin, PRODUCTS_BULK_QUERY);

  await db.syncJob.update({
    where: { id: syncJobId },
    data: { bulkOperationId: operationId },
  });

  // 2. Poll until complete
  const result = await waitForBulkOperation(admin, operationId);

  if (!result.url) {
    // No data returned (empty store) — mark complete with 0 records
    await db.syncJob.update({
      where: { id: syncJobId },
      data: { recordsProcessed: 0 },
    });
    return;
  }

  // 3. Download & parse JSONL
  const raw = await downloadJsonl(result.url);
  const records = parseJsonlLines(raw);
  const byParent = groupByParentId(records);

  // Top-level records are products (no __parentId)
  const productRecords = byParent.get("") ?? [];

  let processedCount = 0;

  for (const product of productRecords) {
    if (!product.id) continue;
    // Upsert product
    await db.product.upsert({
      where: { shopDomain_productGid: { shopDomain, productGid: product.id } },
      update: {
        title: product.title ?? "",
        handle: product.handle ?? null,
        status: product.status ?? null,
        productType: product.productType ?? null,
        vendor: product.vendor ?? null,
        updatedAtShopify: parseDate(product.updatedAt),
      },
      create: {
        shopDomain,
        productGid: product.id,
        title: product.title ?? "",
        handle: product.handle ?? null,
        status: product.status ?? null,
        productType: product.productType ?? null,
        vendor: product.vendor ?? null,
        createdAtShopify: parseDate(product.createdAt),
        updatedAtShopify: parseDate(product.updatedAt),
      },
    });

    processedCount++;

    // Variants are children of this product
    const variants = byParent.get(product.id) ?? [];

    for (const variant of variants) {
      const invItem = variant.inventoryItem ?? null;
      const unitCost = invItem?.unitCost ?? null;
      const unitCostAmount = parseMoney(unitCost?.amount);
      const hasCostData = unitCostAmount != null && unitCostAmount > 0;

      // Upsert variant
      await db.variant.upsert({
        where: { shopDomain_variantGid: { shopDomain, variantGid: variant.id } },
        update: {
          productGid: product.id,
          title: variant.title ?? "",
          sku: variant.sku ?? null,
          price: parseMoney(variant.price) ?? 0,
          compareAtPrice: parseMoney(variant.compareAtPrice),
          inventoryItemGid: invItem?.id ?? null,
          inventoryQuantity: variant.inventoryQuantity ?? null,
          updatedAtShopify: parseDate(variant.updatedAt),
        },
        create: {
          shopDomain,
          variantGid: variant.id,
          productGid: product.id,
          title: variant.title ?? "",
          sku: variant.sku ?? null,
          price: parseMoney(variant.price) ?? 0,
          compareAtPrice: parseMoney(variant.compareAtPrice),
          inventoryItemGid: invItem?.id ?? null,
          inventoryQuantity: variant.inventoryQuantity ?? null,
          createdAtShopify: parseDate(variant.createdAt),
          updatedAtShopify: parseDate(variant.updatedAt),
        },
      });

      // Upsert inventory item (cost data)
      if (invItem?.id) {
        await db.inventoryItem.upsert({
          where: {
            shopDomain_inventoryItemGid: {
              shopDomain,
              inventoryItemGid: invItem.id,
            },
          },
          update: {
            variantGid: variant.id,
            sku: invItem.sku ?? null,
            unitCostAmount,
            unitCostCurrencyCode: unitCost?.currencyCode ?? null,
            hasCostData,
            tracked: invItem.tracked ?? false,
            requiresShipping: invItem.requiresShipping ?? null,
          },
          create: {
            shopDomain,
            inventoryItemGid: invItem.id,
            variantGid: variant.id,
            sku: invItem.sku ?? null,
            unitCostAmount,
            unitCostCurrencyCode: unitCost?.currencyCode ?? null,
            hasCostData,
            tracked: invItem.tracked ?? false,
            requiresShipping: invItem.requiresShipping ?? null,
          },
        });
      }

      processedCount++;
    }
  }

  await db.syncJob.update({
    where: { id: syncJobId },
    data: { recordsProcessed: processedCount },
  });
}
