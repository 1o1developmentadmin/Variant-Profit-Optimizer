import { authenticate } from "../shopify.server";
import db from "../db.server";
import { getSyncStatus } from "../lib/sync/sync.service";
import type { Route } from "./+types/api.setup-health";

export interface SetupHealthData {
  // EPIC-02 spec shape
  syncStatus: "idle" | "running" | "pending" | "completed" | "failed";
  lastFullSyncAt: string | null;
  hasAllOrdersScope: boolean;
  coverage: {
    costCoveragePct: number;
    refundCoveragePct: number;
    inventoryCoveragePct: number;
  };
  warnings: Array<{ code: string; message: string }>;
  // Legacy fields used by onboarding Step 5 and SetupHealthCard
  syncStage: string | null;
  syncProgress: number;
  costCoverage: number;
  inventoryCoverage: number;
  refundDataAvailable: boolean;
  lastSyncAt: string | null;
}

// Simple in-process cache: keyed by shopDomain, expires after 60s
const cache = new Map<string, { data: SetupHealthData; expiresAt: number }>();

export const loader = async ({ request }: Route.LoaderArgs) => {
  await authenticate.admin(request);

  const url = new URL(request.url);
  const shop = url.searchParams.get("shop") ?? "";

  // Return cached response if still fresh
  const cached = cache.get(shop);
  if (cached && cached.expiresAt > Date.now()) {
    return Response.json(cached.data);
  }

  const [shopRecord, syncState] = await Promise.all([
    db.shop.findUnique({ where: { shopDomain: shop } }),
    getSyncStatus(shop),
  ]);

  const warnings: Array<{ code: string; message: string }> = [];

  // Cost coverage: inventory_items with has_cost_data / total variants
  const [variantCount, costItemCount, refundCount] = await Promise.all([
    db.variant.count({ where: { shopDomain: shop } }),
    db.inventoryItem.count({ where: { shopDomain: shop, hasCostData: true } }),
    db.refund.count({ where: { shopDomain: shop } }),
  ]);

  const costCoveragePct =
    variantCount > 0 ? Math.round((costItemCount / variantCount) * 100) : 0;

  // Inventory coverage: variants that have a linked inventory item
  const inventoryLinkedCount = await db.variant.count({
    where: { shopDomain: shop, inventoryItemGid: { not: null } },
  });
  const inventoryCoveragePct =
    variantCount > 0
      ? Math.round((inventoryLinkedCount / variantCount) * 100)
      : 0;

  // Refund coverage: orders that have at least one refund (proxy for refund data quality)
  const orderCount = await db.order.count({ where: { shopDomain: shop } });
  const ordersWithRefundsCount = await db.refund
    .groupBy({ by: ["orderGid"], where: { shopDomain: shop } })
    .then((rows: Array<{ orderGid: string }>) => rows.length);

  const refundCoveragePct =
    orderCount > 0
      ? Math.round((ordersWithRefundsCount / orderCount) * 100)
      : 100; // 100% if no orders yet (no gaps to cover)

  if (costCoveragePct < 50) {
    warnings.push({
      code: "LOW_COST_COVERAGE",
      message: `Only ${costCoveragePct}% of variants have cost data. Profit scores will be unavailable for the rest.`,
    });
  }

  // Map internal status to display progress %
  const progressMap: Record<string, number> = {
    idle: 0,
    pending: 5,
    running: 50,
    completed: 100,
    failed: 0,
  };

  const data: SetupHealthData = {
    syncStatus: syncState.status,
    lastFullSyncAt: shopRecord?.lastFullSyncAt?.toISOString() ?? null,
    hasAllOrdersScope: shopRecord?.hasAllOrdersScope ?? false,
    coverage: {
      costCoveragePct,
      refundCoveragePct,
      inventoryCoveragePct,
    },
    warnings,
    // Legacy compat
    syncStage: syncState.currentJobType,
    syncProgress: progressMap[syncState.status] ?? 0,
    costCoverage: costCoveragePct,
    inventoryCoverage: inventoryCoveragePct,
    refundDataAvailable: refundCount > 0,
    lastSyncAt: shopRecord?.lastFullSyncAt?.toISOString() ?? null,
  };

  cache.set(shop, { data, expiresAt: Date.now() + 60_000 });

  return Response.json(data);
};
