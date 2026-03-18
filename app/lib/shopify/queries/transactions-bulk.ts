/**
 * Job 5 — Transactions  (stored in Phase 1; not used by scoring until Phase 2)
 *
 * `order.transactions` is a direct list (not a paginated connection) in the
 * Shopify admin API, so transactions are inlined as an array inside each
 * Order record in the JSONL output — there is no __parentId on these.
 *
 * The ingest job (transactions-job.ts) extracts them from each Order line.
 */
export const TRANSACTIONS_BULK_QUERY = `{
  orders {
    edges {
      node {
        id
        transactions {
          id
          parentTransaction {
            id
          }
          kind
          status
          gateway
          amountSet { shopMoney { amount currencyCode } }
          processedAt
        }
      }
    }
  }
}`;
