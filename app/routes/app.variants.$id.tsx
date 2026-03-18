import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import type { Route } from "./+types/app.variants.$id";
import { getVariantProfitability } from "../lib/metrics/profitability";
import { VariantHeader } from "../components/variants/VariantHeader";
import { VariantScoreBreakdown } from "../components/variants/VariantScoreBreakdown";
import { VariantActionPanel } from "../components/variants/VariantActionPanel";

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const { session } = await authenticate.admin(request);
  const shopDomain = session.shop;
  const variantGid = decodeURIComponent(params.id);

  const variant = await db.variant.findFirst({
    where: { shopDomain, variantGid },
    select: {
      id: true,
      variantGid: true,
      productGid: true,
      title: true,
      sku: true,
      price: true,
      inventoryQuantity: true,
    },
  });

  if (!variant) {
    throw new Response("Variant not found", { status: 404 });
  }

  const variantScore = await db.variantScore.findUnique({
    where: {
      shopDomain_variantGid: { shopDomain, variantGid },
    },
    select: {
      performanceScore: true,
      profitScore: true,
      refundScore: true,
      inventoryScore: true,
      opportunityScore: true,
      riskScore: true,
      confidenceScore: true,
      recommendedAction: true,
      isSingleVariantProduct: true,
      hasCostData: true,
    },
  });

  const product = await db.product.findFirst({
    where: { shopDomain, productGid: variant.productGid },
    select: { id: true, title: true },
  });

  const profitability = await getVariantProfitability(shopDomain, variantGid, 30);

  const recommendation = await db.recommendation.findFirst({
    where: { shopDomain, variantGid, status: "active" },
    orderBy: { priority: "desc" },
    select: {
      id: true,
      type: true,
      titleText: true,
      bodyText: true,
      confidenceScore: true,
    },
  });

  return {
    variant: {
      id: variant.id,
      variantGid: variant.variantGid,
      title: variant.title,
      sku: variant.sku,
      price: variant.price,
      inventoryQuantity: variant.inventoryQuantity,
    },
    product: product ? { id: product.id, title: product.title } : null,
    score: variantScore
      ? {
          performanceScore: variantScore.performanceScore,
          profitScore: variantScore.profitScore,
          refundScore: variantScore.refundScore,
          inventoryScore: variantScore.inventoryScore,
          opportunityScore: variantScore.opportunityScore,
          riskScore: variantScore.riskScore,
          confidenceScore: variantScore.confidenceScore,
          recommendedAction: variantScore.recommendedAction,
          isSingleVariantProduct: variantScore.isSingleVariantProduct,
          hasCostData: variantScore.hasCostData,
        }
      : null,
    profitability: {
      revenue: profitability.revenue,
      grossProfit: profitability.grossProfit,
      marginPct: profitability.marginPct,
      hasCostData: profitability.hasCostData,
    },
    recommendation: recommendation
      ? {
          id: recommendation.id,
          type: recommendation.type,
          titleText: recommendation.titleText,
          bodyText: recommendation.bodyText,
          confidenceScore: recommendation.confidenceScore,
        }
      : null,
  };
};

function fmt(n: number | null | undefined): string {
  if (n == null) return "—";
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function VariantDetail() {
  const { variant, product, score, profitability, recommendation } =
    useLoaderData<typeof loader>();

  const recommendedAction =
    recommendation?.type ?? score?.recommendedAction ?? null;
  const confidenceScore =
    recommendation?.confidenceScore ?? score?.confidenceScore ?? null;
  const isSingleVariantProduct = score?.isSingleVariantProduct ?? false;
  const hasCostData = profitability?.hasCostData ?? score?.hasCostData ?? false;

  return (
    <s-page heading={variant.title}>
      <s-stack direction="block" gap="base">
        <s-button href="/app/variants" variant="tertiary">
          ← Variants
        </s-button>

        <VariantHeader
          productTitle={product?.title ?? "Unknown Product"}
          variantTitle={variant.title}
          recommendedAction={recommendedAction}
          confidenceScore={confidenceScore}
          isSingleVariantProduct={isSingleVariantProduct}
        />

        <s-section heading="Performance Snapshot">
          <s-stack direction="inline" gap="base">
            <s-badge tone="neutral">
              Revenue: {fmt(profitability?.revenue)}
            </s-badge>
            <s-badge tone="neutral">
              Gross Profit: {profitability?.grossProfit != null ? fmt(profitability.grossProfit) : "—"}
            </s-badge>
            {profitability?.marginPct != null && (
              <s-badge tone="neutral">
                Margin: {profitability.marginPct.toFixed(1)}%
              </s-badge>
            )}
            <s-badge tone="neutral">
              Stock: {variant.inventoryQuantity ?? "—"}
            </s-badge>
          </s-stack>
        </s-section>

        {score && (
          <VariantScoreBreakdown
            performanceScore={score.performanceScore}
            profitScore={score.profitScore}
            refundScore={score.refundScore}
            inventoryScore={score.inventoryScore}
            opportunityScore={score.opportunityScore}
            riskScore={score.riskScore}
            confidenceScore={score.confidenceScore}
            hasCostData={hasCostData}
          />
        )}

        <VariantActionPanel
          type={recommendedAction}
          titleText={recommendation?.titleText ?? null}
          bodyText={recommendation?.bodyText ?? null}
          isSingleVariantProduct={isSingleVariantProduct}
        />
      </s-stack>
    </s-page>
  );
}
