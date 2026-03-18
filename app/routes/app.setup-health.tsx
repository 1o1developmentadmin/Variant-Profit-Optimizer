import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { getSyncStatus } from "../lib/sync/sync.service";
import { SetupHealthCard } from "../components/overview/SetupHealthCard";
import type { Route } from "./+types/app.setup-health";
import type { SetupHealthData } from "./api.setup-health";

export const loader = async ({ request }: Route.LoaderArgs) => {
  const { session } = await authenticate.admin(request);
  const shopDomain = session.shop;

  const [shopRecord, syncState, variantCount, costItemCount, refundCount] =
    await Promise.all([
      db.shop.findUnique({ where: { shopDomain } }),
      getSyncStatus(shopDomain),
      db.variant.count({ where: { shopDomain } }),
      db.inventoryItem.count({ where: { shopDomain, hasCostData: true } }),
      db.refund.count({ where: { shopDomain } }),
    ]);

  const costCoveragePct =
    variantCount > 0 ? Math.round((costItemCount / variantCount) * 100) : 0;

  const inventoryLinkedCount = await db.variant.count({
    where: { shopDomain, inventoryItemGid: { not: null } },
  });
  const inventoryCoveragePct =
    variantCount > 0
      ? Math.round((inventoryLinkedCount / variantCount) * 100)
      : 0;

  const orderCount = await db.order.count({ where: { shopDomain } });
  const ordersWithRefundsCount = await db.refund
    .groupBy({ by: ["orderGid"], where: { shopDomain } })
    .then((rows: Array<{ orderGid: string }>) => rows.length);

  const refundCoveragePct =
    orderCount > 0
      ? Math.round((ordersWithRefundsCount / orderCount) * 100)
      : 100;

  const warnings: Array<{ code: string; message: string }> = [];
  if (costCoveragePct < 50) {
    warnings.push({
      code: "LOW_COST_COVERAGE",
      message: `Only ${costCoveragePct}% of variants have cost data.`,
    });
  }

  const health: SetupHealthData = {
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
    syncProgress: syncState.status === "completed" ? 100 : syncState.status === "running" ? 50 : 0,
    costCoverage: costCoveragePct,
    inventoryCoverage: inventoryCoveragePct,
    refundDataAvailable: refundCount > 0,
    lastSyncAt: shopRecord?.lastFullSyncAt?.toISOString() ?? null,
  };

  return { health };
};

export default function SetupHealth() {
  const { health } = useLoaderData<typeof loader>();

  return (
    <s-page heading="Setup health">
      <SetupHealthCard health={health} />
    </s-page>
  );
}
