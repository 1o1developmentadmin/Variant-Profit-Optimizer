/**
 * GET /api/overview
 * Returns aggregated recommendation summary for the dashboard.
 */
import { authenticate } from "../shopify.server";
import db from "../db.server";
import type { Route } from "./+types/api.overview";

export const loader = async ({ request }: Route.LoaderArgs) => {
  const { session } = await authenticate.admin(request);
  const shopDomain = session.shop;

  const activeRecs = await db.recommendation.findMany({
    where: { shopDomain, status: "active" },
    select: { type: true, confidenceScore: true },
  });

  const byAction: Record<string, number> = {};
  for (const rec of activeRecs) {
    const key = rec.type ?? "unknown";
    byAction[key] = (byAction[key] ?? 0) + 1;
  }

  return Response.json({
    totalActive: activeRecs.length,
    byAction,
  });
};
