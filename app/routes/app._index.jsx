import { useState } from "react";
import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { SummaryCards } from "../components/overview/SummaryCards";
import { HighlightedRecommendations } from "../components/overview/HighlightedRecommendations";
import { OpportunityProductsTable } from "../components/overview/OpportunityProductsTable";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shopDomain = session.shop;

  // Count active recommendations by type
  const recCounts = await db.recommendation.groupBy({
    by: ["type"],
    where: { shopDomain, status: "active" },
    _count: { id: true },
  });

  const countByType = {};
  for (const r of recCounts) {
    if (r.type) countByType[r.type] = r._count.id;
  }

  // Count variant score risk categories
  const lowMarginCount = await db.variantScore.count({
    where: {
      shopDomain,
      hasCostData: true,
      marginPct: { lt: 15 },
    },
  });

  const refundRiskCount = await db.variantScore.count({
    where: {
      shopDomain,
      refundScore: { lt: 40 },
    },
  });

  const stockRiskCount = await db.variantScore.count({
    where: {
      shopDomain,
      inventoryScore: { lt: 40 },
    },
  });

  const summary = {
    push: countByType["push"] ?? 0,
    deprioritize: countByType["deprioritize"] ?? 0,
    lowMargin: lowMarginCount,
    refundRisk: refundRiskCount,
    stockRisk: stockRiskCount,
  };

  // Top 5 highlighted recommendations
  const highlightedRecs = await db.recommendation.findMany({
    where: { shopDomain, status: "active" },
    orderBy: { priority: "desc" },
    take: 5,
    select: {
      id: true,
      variantGid: true,
      variantTitle: true,
      productGid: true,
      type: true,
      confidenceScore: true,
      titleText: true,
      bodyText: true,
    },
  });

  // Enrich with product titles
  const productGids = [...new Set(highlightedRecs.map((r) => r.productGid).filter(Boolean))];
  const products = productGids.length > 0
    ? await db.product.findMany({
        where: { shopDomain, productGid: { in: productGids } },
        select: { productGid: true, title: true },
      })
    : [];
  const productTitleMap = {};
  for (const p of products) {
    productTitleMap[p.productGid] = p.title;
  }

  const highlightedRecommendations = highlightedRecs.map((r) => ({
    id: r.id,
    variantGid: r.variantGid,
    variantTitle: r.variantTitle,
    productTitle: r.productGid ? productTitleMap[r.productGid] ?? null : null,
    type: r.type,
    confidenceScore: r.confidenceScore,
    titleText: r.titleText,
    bodyText: r.bodyText,
  }));

  // Top products by variant count
  const topProducts = await db.product.findMany({
    where: { shopDomain, status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      variants: {
        select: { variantGid: true, inventoryItemGid: true },
      },
    },
  });

  const topProductsMapped = await Promise.all(
    topProducts.map(async (p) => {
      const variantGids = p.variants.map((v) => v.variantGid);
      const missingCostVariants = variantGids.length > 0
        ? await db.inventoryItem.count({
            where: {
              shopDomain,
              variantGid: { in: variantGids },
              hasCostData: false,
            },
          })
        : 0;

      return {
        id: p.id,
        title: p.title,
        variantCount: p.variants.length,
        revenue: 0,
        grossProfit: null,
        marginPct: null,
        missingCostVariants,
      };
    }),
  );

  return {
    summary,
    highlightedRecommendations,
    topProducts: topProductsMapped,
    dateRange: "30d",
  };
};

export default function Index() {
  const { summary, highlightedRecommendations, topProducts } = useLoaderData();
  const [dateRange, setDateRange] = useState("30d");

  return (
    <s-page heading="Overview">
      <s-stack direction="block" gap="large">
        <SummaryCards summary={summary} />
        <HighlightedRecommendations recommendations={highlightedRecommendations} />
        <OpportunityProductsTable products={topProducts} />
      </s-stack>
    </s-page>
  );
}
