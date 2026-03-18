/**
 * Sync Service — Sequential Bulk Job Orchestrator
 *
 * Enforces "only one bulk operation per shop at a time" by:
 *   1. Checking an in-process lock (Map) before starting
 *   2. Checking the DB for any running SyncJob records
 *
 * Job execution order (PRD section 22.5):
 *   1. products  →  2. orders  →  3. refunds  →  4. inventory  →  5. transactions
 *
 * Jobs run in the background via setImmediate so the HTTP request that
 * triggered the sync can return immediately.
 *
 * If any job fails, subsequent queued jobs are paused (not cancelled).
 * The failed job's error_message is recorded in sync_jobs.
 */
import db from "../../db.server";
import { unauthenticated } from "../../shopify.server";
import { runProductsJob } from "./jobs/products-job";
import { runOrdersJob } from "./jobs/orders-job";
import { runRefundsJob } from "./jobs/refunds-job";
import { runInventoryJob } from "./jobs/inventory-job";
import { runTransactionsJob } from "./jobs/transactions-job";
import { runRecomputeDailyMetricsJob } from "./jobs/recomputeDailyMetrics.job";
import { runRecomputeVariantScoresJob } from "./jobs/recomputeVariantScores.job";

const JOB_TYPES = [
  "products",
  "orders",
  "refunds",
  "inventory",
  "transactions",
  "recomputeDailyMetrics",
  "recomputeVariantScores",
] as const;

type JobType = (typeof JOB_TYPES)[number];

// In-process lock — prevents concurrent sync starts within the same Node process
const runningShops = new Set<string>();

/**
 * Starts a full sync for the given shop.
 * Returns immediately; jobs run in the background.
 * No-ops if a sync is already running for this shop.
 */
export async function startFullSync(shopDomain: string): Promise<void> {
  // Guard 1: in-memory lock
  if (runningShops.has(shopDomain)) {
    console.log(`[sync] Skipping startFullSync for ${shopDomain} — already in memory lock`);
    return;
  }

  // Guard 2: DB check for any running job
  const runningJob = await db.syncJob.findFirst({
    where: { shopDomain, status: "running" },
  });

  if (runningJob) {
    console.log(`[sync] Skipping startFullSync for ${shopDomain} — DB job ${runningJob.id} still running`);
    return;
  }

  // Create all 7 job records as "pending"
  const createdJobs = await Promise.all(
    JOB_TYPES.map((jobType) =>
      db.syncJob.create({
        data: { shopDomain, jobType, status: "pending" },
      }),
    ),
  );

  const jobMap = Object.fromEntries(
    createdJobs.map((j: { jobType: string; id: string }) => [j.jobType as JobType, j.id]),
  ) as Record<JobType, string>;

  // Run in background — setTimeout(fn, 0) defers execution past the current call stack
  setTimeout(() => {
    void executeSyncPipeline(shopDomain, jobMap);
  }, 0);
}

async function executeSyncPipeline(
  shopDomain: string,
  jobMap: Record<JobType, string>,
): Promise<void> {
  runningShops.add(shopDomain);

  try {
    const { admin } = await unauthenticated.admin(shopDomain);

    const shopRecord = await db.shop.findUnique({ where: { shopDomain } });
    const syncRangeDays = shopRecord?.syncRange ?? 180;
    const hasAllOrdersScope = shopRecord?.hasAllOrdersScope ?? false;

    for (const jobType of JOB_TYPES) {
      const jobId = jobMap[jobType];

      // Mark running
      await db.syncJob.update({
        where: { id: jobId },
        data: { status: "running", startedAt: new Date() },
      });

      try {
        console.log(`[sync] Starting job: ${jobType} for ${shopDomain}`);

        switch (jobType) {
          case "products":
            await runProductsJob(admin, shopDomain, jobId);
            break;
          case "orders":
            await runOrdersJob(admin, shopDomain, jobId, syncRangeDays, hasAllOrdersScope);
            break;
          case "refunds":
            await runRefundsJob(admin, shopDomain, jobId, syncRangeDays, hasAllOrdersScope);
            break;
          case "inventory":
            await runInventoryJob(admin, shopDomain, jobId);
            break;
          case "transactions":
            await runTransactionsJob(admin, shopDomain, jobId);
            break;
          case "recomputeDailyMetrics":
            await runRecomputeDailyMetricsJob(shopDomain, jobId);
            break;
          case "recomputeVariantScores":
            await runRecomputeVariantScoresJob(shopDomain, jobId);
            break;
        }

        await db.syncJob.update({
          where: { id: jobId },
          data: { status: "completed", finishedAt: new Date() },
        });

        console.log(`[sync] Completed job: ${jobType} for ${shopDomain}`);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : String(err);

        console.error(`[sync] Job ${jobType} failed for ${shopDomain}:`, errorMessage);

        await db.syncJob.update({
          where: { id: jobId },
          data: {
            status: "failed",
            finishedAt: new Date(),
            errorMessage,
          },
        });

        // Pause remaining jobs (set to "failed" with a descriptive message)
        const remainingTypes = JOB_TYPES.slice(JOB_TYPES.indexOf(jobType) + 1);
        for (const remaining of remainingTypes) {
          await db.syncJob.update({
            where: { id: jobMap[remaining] },
            data: {
              status: "failed",
              errorMessage: `Paused: previous job "${jobType}" failed`,
            },
          });
        }

        return; // Stop pipeline
      }
    }

    // All jobs completed — update shop.lastFullSyncAt
    await db.shop.update({
      where: { shopDomain },
      data: { lastFullSyncAt: new Date() },
    });

    console.log(`[sync] Full sync complete for ${shopDomain}`);
  } catch (err) {
    console.error(`[sync] Pipeline error for ${shopDomain}:`, err);
  } finally {
    runningShops.delete(shopDomain);
  }
}

/**
 * Returns the current sync status for a shop based on the most recent jobs.
 */
export async function getSyncStatus(shopDomain: string): Promise<{
  status: "idle" | "running" | "pending" | "completed" | "failed";
  currentJobType: string | null;
  completedJobs: number;
  totalJobs: number;
}> {
  // Find the most recent batch (grouped by createdAt proximity)
  const recentJobs = await db.syncJob.findMany({
    where: { shopDomain },
    orderBy: { createdAt: "desc" },
    take: 7,
  });

  if (recentJobs.length === 0) {
    return { status: "idle", currentJobType: null, completedJobs: 0, totalJobs: 0 };
  }

  const statuses = recentJobs.map((j: { status: string }) => j.status);
  const completedCount = statuses.filter((s: string) => s === "completed").length;

  if (statuses.some((s: string) => s === "running")) {
    const running = recentJobs.find((j: { status: string; jobType: string }) => j.status === "running");
    return {
      status: "running",
      currentJobType: running?.jobType ?? null,
      completedJobs: completedCount,
      totalJobs: recentJobs.length,
    };
  }

  if (statuses.some((s: string) => s === "pending")) {
    return {
      status: "pending",
      currentJobType: null,
      completedJobs: completedCount,
      totalJobs: recentJobs.length,
    };
  }

  if (statuses.some((s: string) => s === "failed")) {
    return {
      status: "failed",
      currentJobType: null,
      completedJobs: completedCount,
      totalJobs: recentJobs.length,
    };
  }

  // All completed
  return {
    status: "completed",
    currentJobType: null,
    completedJobs: completedCount,
    totalJobs: recentJobs.length,
  };
}
