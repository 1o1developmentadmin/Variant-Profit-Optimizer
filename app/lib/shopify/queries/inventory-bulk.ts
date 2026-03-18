/**
 * Job 4 — Inventory Items & Levels per Location
 *
 * JSONL structure:
 *   InventoryItem record  { id, sku, tracked, unitCost: { amount, currencyCode },
 *                           requiresShipping }
 *   InventoryLevel record { id, location: { id },
 *                           quantities: [{ name, quantity }],
 *                           __parentId: inventoryItemGid }
 *
 * `quantities` uses the Shopify 2023-04+ multi-type API with named quantities.
 */
export const INVENTORY_BULK_QUERY = `{
  inventoryItems {
    edges {
      node {
        id
        sku
        tracked
        requiresShipping
        unitCost {
          amount
          currencyCode
        }
        inventoryLevels {
          edges {
            node {
              id
              location {
                id
              }
              quantities(names: ["available", "on_hand", "committed", "reserved", "incoming"]) {
                name
                quantity
              }
            }
          }
        }
      }
    }
  }
}`;
