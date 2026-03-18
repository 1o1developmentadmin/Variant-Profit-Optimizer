/**
 * Job 3 — Refunds & Refund Line Items  (separate job from orders)
 *
 * ⚠️  This MUST remain a separate bulk operation from the orders job.
 *     Nesting refunds inside the orders batch causes JSONL flattening issues
 *     that make __parentId attribution unreliable for refund line items.
 *
 * JSONL structure:
 *   Order record           { id, ... }
 *   Refund record          { id, note, totalRefundedSet, createdAt, processedAt,
 *                            __parentId: orderGid }
 *   RefundLineItem record  { id, quantity, subtotalSet, restockType,
 *                            lineItem: { id, variant: { id } },
 *                            __parentId: refundGid }
 *
 * The `lineItem` sub-object (non-connection) is inlined into the RefundLineItem
 * record — use it to extract orderLineItemGid and variantGid.
 */
export function buildRefundsBulkQuery(sinceDate: string): string {
  return `{
  orders(query: "created_at:>='${sinceDate}'") {
    edges {
      node {
        id
        refunds {
          id
          note
          totalRefundedSet { shopMoney { amount currencyCode } }
          createdAt
          processedAt
          refundLineItems {
            edges {
              node {
                id
                quantity
                subtotalSet { shopMoney { amount currencyCode } }
                totalTaxSet { shopMoney { amount currencyCode } }
                restockType
                lineItem {
                  id
                  variant {
                    id
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}`;
}
