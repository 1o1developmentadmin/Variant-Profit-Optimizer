/**
 * POST /api/sync — triggers a full background sync for the authenticated shop.
 * Called from onboarding (step 4 → 5 transition) and from the Settings page.
 */
import { authenticate } from "../shopify.server";
import { startFullSync } from "../lib/sync/sync.service";
import type { Route } from "./+types/api.sync";

export const action = async ({ request }: Route.ActionArgs) => {
  const { session } = await authenticate.admin(request);
  const shopDomain = session.shop;

  await startFullSync(shopDomain);

  return Response.json({ started: true, shop: shopDomain });
};
