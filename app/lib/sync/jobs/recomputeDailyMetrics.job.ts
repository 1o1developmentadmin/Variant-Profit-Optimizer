/**
 * Recompute Daily Metrics Job — TICKET-03-01
 * Triggered after all ingestion jobs complete. No external API calls.
 */
import db from "../../../db.server";
import { recomputeAllMetricsForShop } from "../../metrics/dailyMetrics";

export async function runRecomputeDailyMetricsJob(
  shopDomain: string,
  syncJobId: string,
): Promise<void> {
  const count = await recomputeAllMetricsForShop(shopDomain);
  await db.syncJob.update({
    where: { id: syncJobId },
    data: { recordsProcessed: count },
  });
}
