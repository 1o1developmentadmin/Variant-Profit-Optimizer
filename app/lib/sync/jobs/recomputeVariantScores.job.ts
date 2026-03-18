/**
 * Recompute Variant Scores Job — EPIC-04
 * Triggered after recomputeDailyMetrics completes. No external API calls.
 */
import db from "../../../db.server";
import { recomputeScoresForShop } from "../../scoring/scoreEngine";

export async function runRecomputeVariantScoresJob(
  shopDomain: string,
  syncJobId: string,
): Promise<void> {
  const count = await recomputeScoresForShop(shopDomain);
  await db.syncJob.update({
    where: { id: syncJobId },
    data: { recordsProcessed: count },
  });
}
