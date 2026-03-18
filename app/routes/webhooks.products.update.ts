/**
 * Webhook: products/update
 * Updates product and variant records (title, price, status, etc.)
 */
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }: { request: Request }) => {
  const { shop, payload } = await authenticate.webhook(request);

  setTimeout(() => void processProductUpdate(shop, payload));

  return new Response(null, { status: 200 });
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function processProductUpdate(shopDomain: string, payload: any) {
  try {
    const productGid = `gid://shopify/Product/${payload.id}`;

    await db.product.upsert({
      where: { shopDomain_productGid: { shopDomain, productGid } },
      update: {
        title: payload.title ?? "",
        handle: payload.handle ?? null,
        status: payload.status?.toUpperCase() ?? null,
        productType: payload.product_type ?? null,
        vendor: payload.vendor ?? null,
        updatedAtShopify: payload.updated_at ? new Date(payload.updated_at) : null,
      },
      create: {
        shopDomain,
        productGid,
        title: payload.title ?? "",
        handle: payload.handle ?? null,
        status: payload.status?.toUpperCase() ?? null,
        productType: payload.product_type ?? null,
        vendor: payload.vendor ?? null,
        createdAtShopify: payload.created_at ? new Date(payload.created_at) : null,
        updatedAtShopify: payload.updated_at ? new Date(payload.updated_at) : null,
      },
    });

    const variants: Array<Record<string, unknown>> = payload.variants ?? [];
    for (const v of variants) {
      const variantGid = `gid://shopify/ProductVariant/${v.id}`;
      const invItemId = v.inventory_item_id;
      const inventoryItemGid = invItemId
        ? `gid://shopify/InventoryItem/${invItemId}`
        : null;

      await db.variant.upsert({
        where: { shopDomain_variantGid: { shopDomain, variantGid } },
        update: {
          productGid,
          title: (v.title as string) ?? "",
          sku: (v.sku as string) ?? null,
          price: v.price ? parseFloat(v.price as string) : 0,
          compareAtPrice: v.compare_at_price ? parseFloat(v.compare_at_price as string) : null,
          inventoryItemGid,
          inventoryQuantity: (v.inventory_quantity as number) ?? null,
          updatedAtShopify: v.updated_at ? new Date(v.updated_at as string) : null,
        },
        create: {
          shopDomain,
          variantGid,
          productGid,
          title: (v.title as string) ?? "",
          sku: (v.sku as string) ?? null,
          price: v.price ? parseFloat(v.price as string) : 0,
          compareAtPrice: v.compare_at_price ? parseFloat(v.compare_at_price as string) : null,
          inventoryItemGid,
          inventoryQuantity: (v.inventory_quantity as number) ?? null,
          createdAtShopify: v.created_at ? new Date(v.created_at as string) : null,
          updatedAtShopify: v.updated_at ? new Date(v.updated_at as string) : null,
        },
      });
    }
  } catch (err) {
    console.error(`[webhook products/update] Error for ${shopDomain}:`, err);
  }
}
