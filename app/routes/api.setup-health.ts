import { authenticate } from "../shopify.server";
import db from "../db.server";
import type { Route } from "./+types/api.setup-health";

export interface SetupHealthData {
  costCoverage: number;
  inventoryCoverage: number;
  hasAllOrdersScope: boolean;
  refundDataAvailable: boolean;
  lastSyncAt: string | null;
  syncStatus: "idle" | "in_progress" | "failed";
  syncStage: string | null;
  syncProgress: number;
}

export const loader = async ({ request }: Route.LoaderArgs) => {
  await authenticate.admin(request);
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop") ?? "";

  const shopRecord = await db.shop.findUnique({ where: { shopDomain: shop } });

  // Stub response until EPIC-02 wires real sync data
  const data: SetupHealthData = {
    costCoverage: 0,
    inventoryCoverage: 0,
    hasAllOrdersScope: shopRecord?.hasAllOrdersScope ?? false,
    refundDataAvailable: false,
    lastSyncAt: null,
    syncStatus: "idle",
    syncStage: null,
    syncProgress: 0,
  };

  return Response.json(data);
};
