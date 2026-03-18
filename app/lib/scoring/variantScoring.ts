/**
 * Variant Scoring Primitives — EPIC-04
 * Core math helpers used by the scoring engine.
 */

export function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Normalizes a value to [0, 1] within [min, max].
 * Returns 0.5 when the range is degenerate (max <= min).
 */
export function normalize(value: number, min: number, max: number): number {
  if (max <= min) return 0.5;
  return clamp((value - min) / (max - min));
}

/**
 * Inverse of normalize — 1 minus the normalized value.
 */
export function inverseNormalize(value: number, min: number, max: number): number {
  return 1 - normalize(value, min, max);
}

/**
 * Maps "days of stock remaining" to a sufficiency score.
 *
 * < 7d  → 0.2  (critical)
 * < 14d → 0.5  (low)
 * ≤ 45d → 0.9  (ideal)
 * ≤ 90d → 0.7  (good, slightly overstocked)
 * > 90d → 0.4  (potentially excess)
 */
export function stockSufficiencyScore(daysLeft: number): number {
  if (daysLeft < 7) return 0.2;
  if (daysLeft < 14) return 0.5;
  if (daysLeft <= 45) return 0.9;
  if (daysLeft <= 90) return 0.7;
  return 0.4;
}

/**
 * Composite inventory score combining stock sufficiency with relative stock level.
 *
 * When velocity <= 0: neutral score of 0.4 (not enough signal).
 * Otherwise: daily_velocity = salesVelocity30d / 30
 *            days_left = currentStock / max(daily_velocity, 0.0001)
 *            score = 0.60 * stockSufficiencyScore(daysLeft) + 0.40 * normalize(currentStock, min, max)
 */
export function computeInventoryScore(
  salesVelocity30d: number,
  currentStock: number,
  minStock: number,
  maxStock: number,
): number {
  if (salesVelocity30d <= 0) return 0.4;
  const dailyVelocity = Math.max(salesVelocity30d / 30, 0.0001);
  const daysLeft = currentStock / dailyVelocity;
  return (
    0.6 * stockSufficiencyScore(daysLeft) +
    0.4 * normalize(currentStock, minStock, maxStock)
  );
}
