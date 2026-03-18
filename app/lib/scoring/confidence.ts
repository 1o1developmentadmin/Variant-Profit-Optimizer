/**
 * Confidence Score Computation — EPIC-04
 *
 * Measures how reliable the scoring signal is for a given variant.
 * Range: 0..1. Lower scores indicate data gaps; scores below the merchant's
 * confidenceMinThreshold result in a "needs_more_data" recommended action.
 */

export interface ConfidenceInput {
  /** Total orders in the scoring window */
  ordersCount: number;
  /** Whether cost data (COGS) is available for the variant */
  hasCostData: boolean;
  /** Whether refund data is present (refundCount > 0 when ordersCount > 0) */
  hasRefundData: boolean;
  /** Whether inventory tracking is enabled for this variant */
  isTracked: boolean;
  /** Whether the parent product has only one variant */
  isSingleVariantProduct: boolean;
  /** Trend consistency score (0..1) from trendConsistencyScore() */
  trendConsistency: number;
}

/**
 * Computes a composite confidence score for a variant's scoring signal.
 */
export function computeConfidenceScore(input: ConfidenceInput): number {
  const {
    ordersCount,
    hasCostData,
    hasRefundData,
    isTracked,
    isSingleVariantProduct,
    trendConsistency,
  } = input;

  // Component 1: sample size quality
  let sampleSizeScore: number;
  if (ordersCount >= 50) sampleSizeScore = 1.0;
  else if (ordersCount >= 20) sampleSizeScore = 0.75;
  else if (ordersCount >= 10) sampleSizeScore = 0.5;
  else sampleSizeScore = 0.25;

  // Component 2: data coverage quality
  let dataCoverageScore = 1.0;
  if (!hasCostData) dataCoverageScore -= 0.35;
  if (!hasRefundData) dataCoverageScore -= 0.20;
  if (!isTracked) dataCoverageScore -= 0.15;
  dataCoverageScore = Math.max(0, dataCoverageScore);

  // Weighted base score
  const base =
    0.4 * sampleSizeScore +
    0.3 * dataCoverageScore +
    0.3 * trendConsistency;

  // Apply caps for known limitations
  let score = base;
  if (!hasCostData) score = Math.min(score, 0.55);
  if (isSingleVariantProduct) score = Math.min(score, 0.60);

  return score;
}
