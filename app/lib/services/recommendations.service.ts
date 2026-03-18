/**
 * Recommendations Service — EPIC-04
 *
 * Syncs VariantScore recommended actions into the Recommendation table.
 * Called by the score engine after all scores have been upserted.
 *
 * Logic per variant:
 *   - Skip if no action or confidence < threshold.
 *   - If active recommendation with same action exists → touch (update lastSeenAt).
 *   - If active recommendation with DIFFERENT action exists → resolve old, create new.
 *   - If no active recommendation → create one.
 */
import db from "../../db.server";
import * as repo from "../db/repositories/recommendations.repo";

export async function syncRecommendations(shopDomain: string): Promise<void> {
  // Load all variant scores for the shop
  const scores = await db.variantScore.findMany({ where: { shopDomain } });

  // Load merchant settings for confidence threshold
  const settings = await db.merchantSettings.findUnique({
    where: { shopDomain },
  });
  const threshold = settings?.confidenceMinThreshold ?? 0.4;

  for (const score of scores) {
    const action = score.recommendedAction;
    const confidence = score.confidenceScore ?? 0;

    if (!action || confidence < threshold) continue;

    const existing = await repo.findActiveRecommendation(
      shopDomain,
      score.variantGid,
      action,
    );

    if (!existing) {
      // Check for any active recommendation with a different action
      const anyActive = await db.recommendation.findFirst({
        where: { shopDomain, variantGid: score.variantGid, status: "active" },
      });
      if (anyActive) {
        // Different action — resolve the stale recommendation
        await repo.resolveRecommendation(anyActive.id);
      }

      // Load variant info for display fields
      const variant = await db.variant.findUnique({
        where: {
          shopDomain_variantGid: { shopDomain, variantGid: score.variantGid },
        },
        select: { title: true, productGid: true },
      });

      const priority = Math.round((score.opportunityScore ?? 0) * 100);

      await repo.createRecommendation({
        shopDomain,
        variantGid: score.variantGid,
        type: action,
        priority,
        titleText: `${action.replace(/_/g, " ")} — ${variant?.title ?? score.variantGid}`,
        bodyText: score.explanationJson ?? "",
        confidenceScore: confidence,
        productGid: variant?.productGid ?? undefined,
        variantTitle: variant?.title ?? undefined,
      });
    } else {
      // Same action — touch to mark as still current
      await repo.touchRecommendation(existing.id);
    }
  }
}
