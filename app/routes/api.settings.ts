/**
 * GET  /api/settings — return merchant settings
 * POST /api/settings — update settings, trigger score recompute
 */
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { recomputeScoresForShop } from "../lib/scoring/scoreEngine";
import type { Route } from "./+types/api.settings";

export interface RecommendationRules {
  push: boolean;
  deprioritize: boolean;
  restock: boolean;
  refundInvestigation: boolean;
}

export interface SettingsData {
  lowMarginThresholdPct: number;
  highRefundThresholdPct: number;
  lowStockDaysThreshold: number;
  confidenceMinThreshold: number;
  costSourceMode: string;
  allowManualCostOverrides: boolean;
  scoringWeightsEditable: false;
  scoringWeights: {
    performance: number;
    profit: number;
    refundRisk: number;
    inventory: number;
  };
  hasAllOrdersScope: boolean;
  costCoveragePct: number;
  recommendationRules: RecommendationRules;
  updatedAt: string | null;
}

const DEFAULT_RECOMMENDATION_RULES: RecommendationRules = {
  push: true,
  deprioritize: true,
  restock: true,
  refundInvestigation: true,
};

const SCORING_WEIGHTS = {
  performance: 0.35,
  profit: 0.35,
  refundRisk: 0.15,
  inventory: 0.15,
};

export const loader = async ({ request }: Route.LoaderArgs) => {
  const { session } = await authenticate.admin(request);
  const shopDomain = session.shop;

  const [settings, shop, totalVariants, variantsWithCost] = await Promise.all([
    db.merchantSettings.findUnique({ where: { shopDomain } }),
    db.shop.findUnique({ where: { shopDomain } }),
    db.variant.count({ where: { shopDomain } }),
    db.inventoryItem.count({ where: { shopDomain, hasCostData: true } }),
  ]);

  const costCoveragePct =
    totalVariants > 0
      ? Math.round((variantsWithCost / totalVariants) * 100)
      : 0;

  const data: SettingsData = {
    lowMarginThresholdPct: settings?.lowMarginThreshold ?? 15,
    highRefundThresholdPct: settings?.refundRiskThreshold ?? 8,
    lowStockDaysThreshold: settings?.stockoutThreshold ?? 10,
    confidenceMinThreshold: settings?.confidenceMinThreshold ?? 0.4,
    costSourceMode: settings?.costSourceMode ?? "shopify",
    allowManualCostOverrides: settings?.allowManualCostOverrides ?? false,
    scoringWeightsEditable: false,
    scoringWeights: SCORING_WEIGHTS,
    hasAllOrdersScope: shop?.hasAllOrdersScope ?? false,
    costCoveragePct,
    recommendationRules: settings?.recommendationRulesJson
      ? (JSON.parse(settings.recommendationRulesJson) as RecommendationRules)
      : DEFAULT_RECOMMENDATION_RULES,
    updatedAt: settings?.updatedAt?.toISOString() ?? null,
  };

  return Response.json(data);
};

export const action = async ({ request }: Route.ActionArgs) => {
  const { session } = await authenticate.admin(request);
  const shopDomain = session.shop;

  const body = (await request.json()) as Record<string, unknown>;

  if ("scoringWeights" in body) {
    return Response.json(
      { error: "Scoring weights are not customizable in this version" },
      { status: 400 },
    );
  }

  const {
    lowMarginThresholdPct,
    highRefundThresholdPct,
    lowStockDaysThreshold,
    confidenceMinThreshold,
    costSourceMode,
    allowManualCostOverrides,
    recommendationRules,
  } = body as {
    lowMarginThresholdPct?: number;
    highRefundThresholdPct?: number;
    lowStockDaysThreshold?: number;
    confidenceMinThreshold?: number;
    costSourceMode?: string;
    allowManualCostOverrides?: boolean;
    recommendationRules?: RecommendationRules;
  };

  if (
    lowMarginThresholdPct !== undefined &&
    (typeof lowMarginThresholdPct !== "number" ||
      lowMarginThresholdPct < 1 ||
      lowMarginThresholdPct > 100)
  ) {
    return Response.json(
      { error: "lowMarginThresholdPct must be between 1 and 100" },
      { status: 400 },
    );
  }
  if (
    highRefundThresholdPct !== undefined &&
    (typeof highRefundThresholdPct !== "number" ||
      highRefundThresholdPct < 1 ||
      highRefundThresholdPct > 100)
  ) {
    return Response.json(
      { error: "highRefundThresholdPct must be between 1 and 100" },
      { status: 400 },
    );
  }
  if (
    lowStockDaysThreshold !== undefined &&
    (typeof lowStockDaysThreshold !== "number" ||
      lowStockDaysThreshold < 1 ||
      lowStockDaysThreshold > 365)
  ) {
    return Response.json(
      { error: "lowStockDaysThreshold must be between 1 and 365" },
      { status: 400 },
    );
  }
  if (
    confidenceMinThreshold !== undefined &&
    (typeof confidenceMinThreshold !== "number" ||
      confidenceMinThreshold < 0.1 ||
      confidenceMinThreshold > 1.0)
  ) {
    return Response.json(
      { error: "confidenceMinThreshold must be between 0.1 and 1.0" },
      { status: 400 },
    );
  }

  const updateData: {
    lowMarginThreshold?: number;
    refundRiskThreshold?: number;
    stockoutThreshold?: number;
    confidenceMinThreshold?: number;
    costSourceMode?: string;
    allowManualCostOverrides?: boolean;
    recommendationRulesJson?: string;
  } = {};

  if (lowMarginThresholdPct !== undefined)
    updateData.lowMarginThreshold = lowMarginThresholdPct;
  if (highRefundThresholdPct !== undefined)
    updateData.refundRiskThreshold = highRefundThresholdPct;
  if (lowStockDaysThreshold !== undefined)
    updateData.stockoutThreshold = Math.round(lowStockDaysThreshold);
  if (confidenceMinThreshold !== undefined)
    updateData.confidenceMinThreshold = confidenceMinThreshold;
  if (costSourceMode !== undefined)
    updateData.costSourceMode = costSourceMode;
  if (allowManualCostOverrides !== undefined)
    updateData.allowManualCostOverrides = allowManualCostOverrides;
  if (recommendationRules !== undefined)
    updateData.recommendationRulesJson = JSON.stringify(recommendationRules);

  const updated = await db.merchantSettings.upsert({
    where: { shopDomain },
    create: { shopDomain, ...updateData },
    update: updateData,
  });

  // Fire-and-forget score recompute
  setTimeout(() => {
    recomputeScoresForShop(shopDomain).catch((err: Error) =>
      console.error("[settings] recompute error:", err),
    );
  }, 0);

  return Response.json({ ok: true, updatedAt: updated.updatedAt.toISOString() });
};
