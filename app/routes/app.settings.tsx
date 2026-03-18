import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import type { Route } from "./+types/app.settings";
import { CostSettingsForm } from "../components/settings/CostSettingsForm";
import { ThresholdSettingsForm } from "../components/settings/ThresholdSettingsForm";
import { ScoringWeightsDisplay } from "../components/settings/ScoringWeightsDisplay";
import { RecommendationRulesForm } from "../components/settings/RecommendationRulesForm";
import type { RecommendationRules } from "./api.settings";

const DEFAULT_RECOMMENDATION_RULES: RecommendationRules = {
  push: true,
  deprioritize: true,
  restock: true,
  refundInvestigation: true,
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

  const updatedAt = settings?.updatedAt?.toISOString() ?? null;

  return {
    shopDomain,
    hasAllOrdersScope: shop?.hasAllOrdersScope ?? false,
    thresholds: {
      lowMarginThresholdPct: settings?.lowMarginThreshold ?? 15,
      highRefundThresholdPct: settings?.refundRiskThreshold ?? 8,
      lowStockDaysThreshold: settings?.stockoutThreshold ?? 10,
      confidenceMinThreshold: settings?.confidenceMinThreshold ?? 0.4,
      updatedAt,
    },
    cost: {
      costSourceMode: settings?.costSourceMode ?? "shopify",
      allowManualCostOverrides: settings?.allowManualCostOverrides ?? false,
      costCoveragePct,
      updatedAt,
    },
    recommendationRules: {
      recommendationRules: settings?.recommendationRulesJson
        ? (JSON.parse(settings.recommendationRulesJson) as RecommendationRules)
        : DEFAULT_RECOMMENDATION_RULES,
      updatedAt,
    },
  };
};

export default function Settings() {
  const data = useLoaderData<typeof loader>();

  return (
    <s-page heading="Settings">
      {!data.hasAllOrdersScope && (
        <s-banner tone="warning">
          <s-paragraph>
            Extended order history is not enabled. You can only sync up to 60
            days of orders.
          </s-paragraph>
          <s-button
            variant="secondary"
            onClick={() =>
              (window.location.href = `/auth?shop=${data.shopDomain}`)
            }
          >
            Enable extended order history
          </s-button>
        </s-banner>
      )}

      <CostSettingsForm initial={data.cost} />
      <ThresholdSettingsForm initial={data.thresholds} />
      <ScoringWeightsDisplay />
      <RecommendationRulesForm initial={data.recommendationRules} />
    </s-page>
  );
}
