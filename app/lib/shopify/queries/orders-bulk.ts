/**
 * Job 2 — Orders & Order Line Items
 *
 * The query filter is injected at runtime based on:
 *  - merchant syncRange (days)
 *  - hasAllOrdersScope: if false and window > 60 days, cap at 60 days
 *
 * JSONL structure:
 *   Order record     { id, name, email, financialStatus, ... }
 *   LineItem record  { id, title, quantity, price, variant: { id }, __parentId: orderGid }
 */
export function buildOrdersBulkQuery(sinceDate: string): string {
  return `{
  orders(query: "created_at:>='${sinceDate}'") {
    edges {
      node {
        id
        name
        email
        displayFinancialStatus
        displayFulfillmentStatus
        totalPriceSet { shopMoney { amount currencyCode } }
        subtotalPriceSet { shopMoney { amount currencyCode } }
        test
        processedAt
        cancelledAt
        closedAt
        createdAt
        updatedAt
        lineItems {
          edges {
            node {
              id
              title
              variantTitle
              quantity
              originalUnitPriceSet { shopMoney { amount currencyCode } }
              discountedTotalSet { shopMoney { amount currencyCode } }
              sku
              isGiftCard
              requiresShipping
              variant {
                id
              }
            }
          }
        }
      }
    }
  }
}`;
}

/**
 * Calculates the ISO date string for the sync start date.
 * If the merchant lacks read_all_orders scope, caps at 60 days and warns.
 */
export function resolveSyncSinceDate(
  syncRangeDays: number,
  hasAllOrdersScope: boolean,
): { sinceDate: string; cappedAt60Days: boolean } {
  let days = syncRangeDays;
  let cappedAt60Days = false;

  if (!hasAllOrdersScope && days > 60) {
    days = 60;
    cappedAt60Days = true;
    console.warn(
      `[orders-bulk] read_all_orders scope absent — capping sync range from ${syncRangeDays}d to 60d`,
    );
  }

  const since = new Date();
  since.setDate(since.getDate() - days);
  return {
    sinceDate: since.toISOString().split("T")[0], // YYYY-MM-DD
    cappedAt60Days,
  };
}
