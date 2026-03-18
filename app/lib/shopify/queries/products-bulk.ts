/**
 * Job 1 — Products & Variants (with inventory item cost data)
 *
 * JSONL structure:
 *   Product record  { id, title, handle, status, productType, vendor, createdAt, updatedAt }
 *   Variant record  { id, ..., inventoryItem: { id, unitCost, tracked }, __parentId: productGid }
 */
export const PRODUCTS_BULK_QUERY = `{
  products {
    edges {
      node {
        id
        title
        handle
        status
        productType
        vendor
        createdAt
        updatedAt
        variants {
          edges {
            node {
              id
              title
              sku
              price
              compareAtPrice
              inventoryQuantity
              createdAt
              updatedAt
              inventoryItem {
                id
                sku
                tracked
                requiresShipping
                unitCost {
                  amount
                  currencyCode
                }
              }
            }
          }
        }
      }
    }
  }
}`;
