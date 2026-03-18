import { authenticate } from "../shopify.server";
import { computeSetupHealth } from "../lib/services/setupHealth.service";
import type { Route } from "./+types/api.setup-health";
import type { SetupHealthResult } from "../lib/services/setupHealth.service";

// Re-export type with same name for backward compat
export type SetupHealthData = SetupHealthResult;

// Simple in-process cache: keyed by shopDomain, expires after 60s
const cache = new Map<string, { data: SetupHealthData; expiresAt: number }>();

export const loader = async ({ request }: Route.LoaderArgs) => {
  await authenticate.admin(request);

  const url = new URL(request.url);
  const shop = url.searchParams.get("shop") ?? "";

  const cached = cache.get(shop);
  if (cached && cached.expiresAt > Date.now()) {
    return Response.json(cached.data);
  }

  const data = await computeSetupHealth(shop);
  cache.set(shop, { data, expiresAt: Date.now() + 60_000 });

  return Response.json(data);
};
