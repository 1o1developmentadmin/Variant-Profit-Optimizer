/**
 * Webhook: inventory_levels/update
 * Updates the inventory level for a specific item + location.
 */
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }: { request: Request }) => {
  const { shop, payload } = await authenticate.webhook(request);

  setTimeout(() => void processInventoryLevelUpdate(shop, payload));

  return new Response(null, { status: 200 });
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function processInventoryLevelUpdate(shopDomain: string, payload: any) {
  try {
    const inventoryItemGid = `gid://shopify/InventoryItem/${payload.inventory_item_id}`;
    const locationGid = `gid://shopify/Location/${payload.location_id}`;
    const available = payload.available != null ? parseInt(String(payload.available), 10) : 0;

    // Only update if the inventory item exists
    const itemExists = await db.inventoryItem.findUnique({
      where: { shopDomain_inventoryItemGid: { shopDomain, inventoryItemGid } },
      select: { id: true },
    });
    if (!itemExists) return;

    await db.inventoryLevel.upsert({
      where: {
        shopDomain_inventoryItemGid_locationGid: {
          shopDomain,
          inventoryItemGid,
          locationGid,
        },
      },
      update: {
        available,
        updatedAtShopify: payload.updated_at ? new Date(payload.updated_at) : null,
      },
      create: {
        shopDomain,
        inventoryItemGid,
        locationGid,
        available,
        updatedAtShopify: payload.updated_at ? new Date(payload.updated_at) : null,
      },
    });
  } catch (err) {
    console.error(`[webhook inventory_levels/update] Error for ${shopDomain}:`, err);
  }
}
