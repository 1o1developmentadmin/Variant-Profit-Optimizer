/**
 * Setup Health Service — TICKET-03-06
 * Computes coverage percentages for cost, refund, and inventory data.
 */
import db from "../../db.server";
import { getSyncStatus } from "../sync/sync.service";

export interface SetupHealthResult {
  syncStatus: "idle" | "running" | "pending" | "completed" | "failed";
  lastFullSyncAt: string | null;
  hasAllOrdersScope: boolean;
  coverage: {
    costCoveragePct: number;
    refundCoveragePct: number;
    inventoryCoveragePct: number;
  };
  warnings: Array<{ code: string; message: string }>;
  syncStage: string | null;
  syncProgress: number;
  costCoverage: number;
  inventoryCoverage: number;
  refundDataAvailable: boolean;
  lastSyncAt: string | null;
}

const progressMap: Record<string, number> = {
  idle: 0,
  pending: 5,
  running: 50,
  completed: 100,
  failed: 0,
};

export async function computeSetupHealth(shopDomain: string): Promise<SetupHealthResult> {
  const [shopRecord, syncState] = await Promise.all([
    db.shop.findUnique({ where: { shopDomain } }),
    getSyncStatus(shopDomain),
  ]);

  // costCoveragePct: variants with has_cost_data / total active variants
  const [variantCount, refundCount] = await Promise.all([
    db.variant.count({ where: { shopDomain } }),
    db.refund.count({ where: { shopDomain } }),
  ]);

  const costItemCount = await db.inventoryItem.count({
    where: { shopDomain, hasCostData: true },
  });
  const costCoveragePct =
    variantCount > 0 ? Math.round((costItemCount / variantCount) * 100) : 0;

  // inventoryCoveragePct: variants with tracked inventory item
  const trackedCount = await db.inventoryItem.count({
    where: { shopDomain, tracked: true, variantGid: { not: null } },
  });
  const inventoryCoveragePct =
    variantCount > 0 ? Math.round((trackedCount / variantCount) * 100) : 0;

  // refundCoveragePct: always 100% in Phase 1 (all refund data available from sync)
  const refundCoveragePct = 100;

  const warnings: Array<{ code: string; message: string }> = [];
  if (costCoveragePct < 50) {
    warnings.push({
      code: "LOW_COST_COVERAGE",
      message: `Only ${costCoveragePct}% of variants have cost data. Profit scores will be unavailable for the rest.`,
    });
  }
  if (inventoryCoveragePct < 70) {
    warnings.push({
      code: "INCOMPLETE_INVENTORY",
      message: `Only ${inventoryCoveragePct}% of variants have tracked inventory. Stock health scores may be incomplete.`,
    });
  }

  return {
    syncStatus: syncState.status,
    lastFullSyncAt: shopRecord?.lastFullSyncAt?.toISOString() ?? null,
    hasAllOrdersScope: shopRecord?.hasAllOrdersScope ?? false,
    coverage: {
      costCoveragePct,
      refundCoveragePct,
      inventoryCoveragePct,
    },
    warnings,
    syncStage: syncState.currentJobType,
    syncProgress: progressMap[syncState.status] ?? 0,
    costCoverage: costCoveragePct,
    inventoryCoverage: inventoryCoveragePct,
    refundDataAvailable: refundCount > 0,
    lastSyncAt: shopRecord?.lastFullSyncAt?.toISOString() ?? null,
  };
}
