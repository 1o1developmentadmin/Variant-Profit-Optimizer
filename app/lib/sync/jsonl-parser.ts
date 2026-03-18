/**
 * JSONL parser for Shopify Bulk Operations output.
 *
 * Shopify flattens nested connections into separate lines with a `__parentId`
 * field pointing to the parent record's GID.  Non-connection fields (e.g.
 * `inventoryItem` on a variant, `variant` inside a line item) remain as
 * inlined sub-objects on the parent line.
 *
 * Usage:
 *   const records = parseJsonlLines(rawText);
 *   const byParent = groupByParentId(records);
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type JsonlRecord = Record<string, any> & { id?: string; __parentId?: string };

/**
 * Splits raw JSONL text into parsed records.  Empty lines are skipped.
 */
export function parseJsonlLines(raw: string): JsonlRecord[] {
  return raw
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .map((line) => JSON.parse(line) as JsonlRecord);
}

/**
 * Groups records by their `__parentId`.
 * Records without a `__parentId` (top-level) are stored under the key `""`.
 */
export function groupByParentId(
  records: JsonlRecord[],
): Map<string, JsonlRecord[]> {
  const map = new Map<string, JsonlRecord[]>();

  for (const record of records) {
    const key = record.__parentId ?? "";
    const bucket = map.get(key) ?? [];
    bucket.push(record);
    map.set(key, bucket);
  }

  return map;
}

/**
 * Returns the numeric Shopify ID from a GID string.
 * e.g. "gid://shopify/Product/123" → "123"
 */
export function gidToId(gid: string): string {
  return gid.split("/").pop() ?? gid;
}

/**
 * Safely parses a float from Shopify's money string fields (e.g. "19.99").
 */
export function parseMoney(value: unknown): number | null {
  if (value == null) return null;
  const n = parseFloat(String(value));
  return isNaN(n) ? null : n;
}

/**
 * Safely parses a DateTime string into a JS Date (or null).
 */
export function parseDate(value: unknown): Date | null {
  if (!value) return null;
  const d = new Date(String(value));
  return isNaN(d.getTime()) ? null : d;
}
