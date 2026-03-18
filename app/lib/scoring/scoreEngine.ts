/**
 * Score Engine — EPIC-04
 *
 * Orchestrates all per-variant scoring:
 *   1. Load all variants + inventory items for the shop (bulk).
 *   2. For each variant compute sub-scores using metrics + sibling context.
 *   3. Upsert VariantScore rows.
 *   4. Call syncRecommendations to propagate actions → Recommendation table.
 */
import db from "../../db.server";
import type { InventoryItem } from "@prisma/client";
import { computeSiblingContext } from "../metrics/aggregates";
import { getVariantWindowMetrics } from "../metrics/dailyMetrics";
import {
  normalize,
  inverseNormalize,
  computeInventoryScore,
} from "./variantScoring";
import { trendScore, trendConsistencyScore } from "./trendScore";
import { computeConfidenceScore } from "./confidence";
import { generateExplanation } from "./explanations";
import { syncRecommendations } from "../services/recommendations.service";

// ---------------------------------------------------------------------------
// Action selector
// ---------------------------------------------------------------------------

function selectAction(
  opportunityScore: number,
  refundScore: number,
  inventoryScore: number,
  profitScore: number | null,
  confidenceScore: number,
  isSingleVariant: boolean,
  confidenceThreshold: number,
): string {
  if (confidenceScore < confidenceThreshold) return "needs_more_data";

  const allowed = isSingleVariant
    ? ["restock_soon", "investigate_refunds", "review_pricing", "no_action"]
    : [
        "push",
        "restock_soon",
        "deprioritize",
        "investigate_refunds",
        "review_pricing",
        "no_action",
      ];

  if (inventoryScore <= 0.4 && allowed.includes("restock_soon"))
    return "restock_soon";
  if (refundScore <= 0.4 && allowed.includes("investigate_refunds"))
    return "investigate_refunds";
  if (
    profitScore !== null &&
    profitScore <= 0.35 &&
    allowed.includes("review_pricing")
  )
    return "review_pricing";
  if (opportunityScore >= 0.65 && allowed.includes("push")) return "push";
  if (opportunityScore <= 0.3 && allowed.includes("deprioritize"))
    return "deprioritize";
  return "no_action";
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export async function recomputeScoresForShop(shopDomain: string): Promise<number> {
  // --- Load merchant settings ---
  const settings = await db.merchantSettings.findUnique({
    where: { shopDomain },
  });
  const confidenceThreshold = settings?.confidenceMinThreshold ?? 0.4;

  // --- Bulk load inventory items (avoid N+1) ---
  const invItems: InventoryItem[] = await db.inventoryItem.findMany({
    where: { shopDomain },
  });
  const invItemMap = new Map<string, InventoryItem>(
    invItems
      .filter((i: InventoryItem) => i.variantGid != null)
      .map((i: InventoryItem) => [i.variantGid!, i]),
  );

  // --- Load all variants ---
  const variants = await db.variant.findMany({ where: { shopDomain } });

  if (variants.length === 0) return 0;

  // --- Build per-product variant count map to detect single-variant products ---
  const productVariantCount = new Map<string, number>();
  for (const v of variants) {
    const count = productVariantCount.get(v.productGid) ?? 0;
    productVariantCount.set(v.productGid, count + 1);
  }

  // --- Cache sibling context per product ---
  const siblingContextCache = new Map<
    string,
    Awaited<ReturnType<typeof computeSiblingContext>>
  >();

  let scoredCount = 0;

  for (const variant of variants) {
    const variantGid = variant.variantGid;
    const productGid = variant.productGid;
    const isSingleVariantProduct =
      (productVariantCount.get(productGid) ?? 1) <= 1;

    // ---- Fetch / cache sibling context ----
    let siblingCtx = siblingContextCache.get(productGid);
    if (!siblingCtx) {
      siblingCtx = await computeSiblingContext(productGid, shopDomain, 30);
      siblingContextCache.set(productGid, siblingCtx);
    }

    // ---- Window metrics ----
    const wm = await getVariantWindowMetrics(shopDomain, variantGid, 30);

    // ---- Orders count + refund signal from daily metrics ----
    const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const metricRows = await db.variantDailyMetrics.findMany({
      where: { shopDomain, variantGid, date: { gte: since30d } },
      select: { ordersCount: true, refundCount: true },
    });
    const ordersCount = metricRows.reduce(
      (s: number, r: { ordersCount: number }) => s + r.ordersCount,
      0,
    );
    const hasRefundData = metricRows.some(
      (r: { refundCount: number }) => r.refundCount > 0,
    );

    // ---- Inventory tracking ----
    const invItem = invItemMap.get(variantGid);
    const isTracked = invItem?.tracked ?? false;
    const hasCostData = wm.hasCostData;

    // ---- Sub-scores ----

    // Performance score: relative units sold + revenue vs siblings
    const performanceScore =
      0.5 *
        normalize(wm.unitsSold, siblingCtx.minUnitsSold, siblingCtx.maxUnitsSold) +
      0.5 * normalize(wm.revenue, siblingCtx.minRevenue, siblingCtx.maxRevenue);

    // Profit score: null when no cost data
    let profitScore: number | null = null;
    if (
      hasCostData &&
      siblingCtx.minGrossProfit != null &&
      siblingCtx.maxGrossProfit != null
    ) {
      profitScore = normalize(
        wm.grossProfit ?? 0,
        siblingCtx.minGrossProfit,
        siblingCtx.maxGrossProfit,
      );
    }

    // Refund score: inverse normalised refund rate (lower refunds = higher score)
    const refundRate =
      wm.unitsSold > 0 ? (wm.refundAmount / (wm.revenue || 1)) * 100 : 0;
    const refundScore = inverseNormalize(
      refundRate,
      siblingCtx.minRefundRate,
      siblingCtx.maxRefundRate,
    );

    // Inventory score
    const currentStock = wm.endingStockQuantity ?? 0;
    const inventoryScore = computeInventoryScore(
      wm.salesVelocity30d,
      currentStock,
      siblingCtx.minStock,
      siblingCtx.maxStock,
    );

    // Trend score
    const trend = trendScore(wm.unitsSoldLast14d, wm.unitsSoldPrior14d);

    // Trend consistency (queries DB — per variant)
    const consistency = await trendConsistencyScore(shopDomain, variantGid);

    // Confidence score
    const confidenceScore = computeConfidenceScore({
      ordersCount,
      hasCostData,
      hasRefundData,
      isTracked,
      isSingleVariantProduct,
      trendConsistency: consistency,
    });

    // Opportunity score: blend of performance + profit + trend
    const opportunityScore =
      0.4 * performanceScore +
      0.3 * (profitScore ?? performanceScore) + // fall back to perf when no cost
      0.3 * trend;

    // Risk score: refund risk + inventory risk
    const riskScore =
      0.5 * (1 - refundScore) + 0.5 * (1 - inventoryScore);

    // Recommended action
    const recommendedAction = selectAction(
      opportunityScore,
      refundScore,
      inventoryScore,
      profitScore,
      confidenceScore,
      isSingleVariantProduct,
      confidenceThreshold,
    );

    // Explanation JSON
    const explanation = generateExplanation({
      variantTitle: variant.title,
      recommendedAction,
      performanceScore,
      profitScore,
      refundScore,
      inventoryScore,
      confidenceScore,
      hasCostData,
      isSingleVariantProduct,
      marginPct: wm.marginPct,
      unitsSold: wm.unitsSold,
    });

    // ---- Upsert VariantScore ----
    await db.variantScore.upsert({
      where: {
        shopDomain_variantGid: { shopDomain, variantGid },
      },
      update: {
        profitScore,
        marginPct: wm.marginPct,
        refundRate,
        performanceScore,
        refundScore,
        inventoryScore,
        opportunityScore,
        riskScore,
        confidenceScore,
        recommendedAction,
        isSingleVariantProduct,
        hasCostData,
        explanationJson: JSON.stringify(explanation),
        scoredAt: new Date(),
        scoreWindow: "30d",
      },
      create: {
        shopDomain,
        variantGid,
        profitScore,
        marginPct: wm.marginPct,
        refundRate,
        performanceScore,
        refundScore,
        inventoryScore,
        opportunityScore,
        riskScore,
        confidenceScore,
        recommendedAction,
        isSingleVariantProduct,
        hasCostData,
        explanationJson: JSON.stringify(explanation),
        scoreWindow: "30d",
      },
    });

    scoredCount++;
  }

  // Propagate scores → recommendations table
  await syncRecommendations(shopDomain);

  return scoredCount;
}
