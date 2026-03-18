/**
 * GET  /api/recommendations  — list active recommendations with optional filters
 * POST /api/recommendations  — dismiss a recommendation by id
 */
import { authenticate } from "../shopify.server";
import { getActiveRecommendations } from "../lib/db/repositories/recommendations.repo";
import db from "../db.server";
import type { Route } from "./+types/api.recommendations";

export const loader = async ({ request }: Route.LoaderArgs) => {
  const { session } = await authenticate.admin(request);
  const shopDomain = session.shop;
  const url = new URL(request.url);

  const type = url.searchParams.get("action") ?? undefined;
  const productGid = url.searchParams.get("productGid") ?? undefined;
  const minConfidenceParam = url.searchParams.get("minConfidence");
  const minConfidence = minConfidenceParam
    ? parseFloat(minConfidenceParam)
    : undefined;

  const recs = await getActiveRecommendations(shopDomain, {
    type,
    productGid,
    minConfidence,
  });

  return Response.json({ recommendations: recs });
};

export const action = async ({ request }: Route.ActionArgs) => {
  const { session } = await authenticate.admin(request);
  const shopDomain = session.shop;

  const body = (await request.json()) as { id: string; status: "dismissed" };

  if (body.status === "dismissed") {
    await db.recommendation.update({
      where: { id: body.id, shopDomain },
      data: { status: "dismissed", dismissedAt: new Date() },
    });
    return Response.json({ ok: true });
  }

  return Response.json({ error: "Invalid action" }, { status: 400 });
};
