/**
 * Helpers for submitting, polling, and downloading Shopify Bulk Operations.
 * Only one bulk operation can run per shop at a time — callers (sync.service.ts)
 * enforce sequencing via the job queue.
 */

const POLL_INTERVAL_MS = 5_000;
const MAX_POLL_ATTEMPTS = 720; // 1 hour max

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

type AdminClient = {
  graphql: (query: string, options?: { variables?: Record<string, unknown> }) => Promise<Response>;
};

interface BulkOperationResult {
  id: string;
  status: string;
  url: string | null;
  objectCount: string;
  errorCode: string | null;
}

/**
 * Submits a bulk operation query and returns the bulk operation ID.
 */
export async function submitBulkOperation(
  admin: AdminClient,
  bulkQuery: string,
): Promise<string> {
  const res = await admin.graphql(
    `#graphql
    mutation BulkQuery($query: String!) {
      bulkOperationRunQuery(query: $query) {
        bulkOperation { id status }
        userErrors { field message }
      }
    }`,
    { variables: { query: bulkQuery } },
  );

  const { data } = await res.json();
  const { bulkOperation, userErrors } = data.bulkOperationRunQuery;

  if (userErrors?.length > 0) {
    throw new Error(
      `Bulk operation error: ${userErrors.map((e: { message: string }) => e.message).join(", ")}`,
    );
  }

  return bulkOperation.id as string;
}

/**
 * Polls the current bulk operation until it completes or fails.
 * Returns the completed result including the download URL.
 */
export async function waitForBulkOperation(
  admin: AdminClient,
  operationId: string,
): Promise<BulkOperationResult> {
  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    await sleep(POLL_INTERVAL_MS);

    const res = await admin.graphql(`#graphql
      query {
        currentBulkOperation {
          id status errorCode url objectCount
        }
      }
    `);

    const { data } = await res.json();
    const op = data.currentBulkOperation as BulkOperationResult | null;

    if (!op) {
      throw new Error(`Bulk operation ${operationId} not found`);
    }

    if (op.status === "COMPLETED") return op;
    if (op.status === "FAILED" || op.status === "EXPIRED") {
      throw new Error(
        `Bulk operation ${operationId} ended with status ${op.status}: ${op.errorCode ?? "unknown"}`,
      );
    }

    // CREATED | RUNNING | CANCELING | CANCELED — keep polling
  }

  throw new Error(`Bulk operation ${operationId} timed out after polling`);
}

/**
 * Downloads the JSONL result file from the given URL.
 * Returns the raw text content (newline-delimited JSON).
 */
export async function downloadJsonl(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to download JSONL (HTTP ${res.status}): ${url}`);
  }
  return res.text();
}
