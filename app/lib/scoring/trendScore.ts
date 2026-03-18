/**
 * Trend Scoring Helpers — EPIC-04
 */
import db from "../../db.server";

/**
 * Computes a trend score from the last-14d vs prior-14d unit comparison.
 *
 * - prior = 0 & last > 0 → 0.75 (new activity, promising but uncertain)
 * - prior = 0 & last = 0 → 0.5  (no signal)
 * - ratio = last / prior:
 *     ≥ 1.25 → 1.0
 *     ≥ 1.05 → 0.75
 *     ≥ 0.80 → 0.5
 *     ≥ 0.50 → 0.25
 *     else   → 0.0
 */
export function trendScore(last14d: number, prior14d: number): number {
  if (prior14d === 0 && last14d > 0) return 0.75;
  if (prior14d === 0 && last14d === 0) return 0.5;
  const ratio = last14d / prior14d;
  if (ratio >= 1.25) return 1.0;
  if (ratio >= 1.05) return 0.75;
  if (ratio >= 0.80) return 0.5;
  if (ratio >= 0.50) return 0.25;
  return 0.0;
}

/**
 * Queries the last 28+ days of daily metrics for a variant.
 * Splits into 4 weekly buckets and counts direction changes.
 *
 * Returns 0.5 if fewer than 28 rows are available (insufficient data).
 *
 * Direction changes:
 *   0 → 1.0
 *   1 → 0.70
 *   2 → 0.40
 *   3+ → 0.20
 */
export async function trendConsistencyScore(
  shopDomain: string,
  variantGid: string,
): Promise<number> {
  const rows = await db.variantDailyMetrics.findMany({
    where: { shopDomain, variantGid },
    orderBy: { date: "asc" },
    select: { date: true, unitsSold: true },
  });

  if (rows.length < 28) return 0.5;

  // Take the most recent 28 rows
  const recent = rows.slice(-28);

  // Split into 4 buckets of 7 days
  const buckets: number[] = [];
  for (let i = 0; i < 4; i++) {
    const slice = recent.slice(i * 7, i * 7 + 7);
    const sum = slice.reduce(
      (s: number, r: { unitsSold: number }) => s + r.unitsSold,
      0,
    );
    buckets.push(sum);
  }

  // Count direction changes between consecutive buckets
  let changes = 0;
  for (let i = 1; i < buckets.length; i++) {
    const prev = buckets[i - 1];
    const curr = buckets[i];
    // A "change" is a reversal in direction
    if (i >= 2) {
      const prevDir = buckets[i - 1] - buckets[i - 2];
      const currDir = curr - prev;
      if (prevDir > 0 && currDir < 0) changes++;
      else if (prevDir < 0 && currDir > 0) changes++;
    }
  }

  if (changes === 0) return 1.0;
  if (changes === 1) return 0.7;
  if (changes === 2) return 0.4;
  return 0.2;
}
