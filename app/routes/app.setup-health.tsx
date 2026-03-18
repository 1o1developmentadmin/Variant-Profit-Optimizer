import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { SetupHealthCard } from "../components/overview/SetupHealthCard";
import type { Route } from "./+types/app.setup-health";
import type { SetupHealthData } from "./api.setup-health";

export const loader = async ({ request }: Route.LoaderArgs) => {
  const { session } = await authenticate.admin(request);

  const shopRecord = await db.shop.findUnique({
    where: { shopDomain: session.shop },
  });

  // Stub health data until EPIC-02 provides real sync state
  const health: SetupHealthData = {
    costCoverage: 0,
    inventoryCoverage: 0,
    hasAllOrdersScope: shopRecord?.hasAllOrdersScope ?? false,
    refundDataAvailable: false,
    lastSyncAt: null,
    syncStatus: "idle",
    syncStage: null,
    syncProgress: 0,
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
