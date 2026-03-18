/**
 * GET /api/variants/:id
 * Returns the score breakdown and explanation for a single variant.
 * :id must be URL-encoded (e.g. gid%3A%2F%2Fshopify%2FProductVariant%2F123)
 */
import { authenticate } from "../shopify.server";
import db from "../db.server";
import type { Route } from "./+types/api.variants.$id";

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const { session } = await authenticate.admin(request);
  const shopDomain = session.shop;
  const variantGid = decodeURIComponent(params.id);

  const score = await db.variantScore.findUnique({
    where: { shopDomain_variantGid: { shopDomain, variantGid } },
  });

  if (!score) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const explanationJson = score.explanationJson
    ? JSON.parse(score.explanationJson)
    : null;

  return Response.json({
    variantGid,
    scoreBreakdown: {
      performanceScore: score.performanceScore,
      profitScore: score.profitScore,
      refundScore: score.refundScore,
      inventoryScore: score.inventoryScore,
      opportunityScore: score.opportunityScore,
      riskScore: score.riskScore,
      confidenceScore: score.confidenceScore,
      recommendedAction: score.recommendedAction,
      isSingleVariantProduct: score.isSingleVariantProduct,
      hasCostData: score.hasCostData,
      scoredAt: score.scoredAt,
      explanation: explanationJson,
    },
  });
};
