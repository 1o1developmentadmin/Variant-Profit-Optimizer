/**
 * POST /api/sync — triggers a full background sync for the authenticated shop.
 * Called from onboarding (step 4 → 5 transition) and from the Settings page.
 */
import { authenticate } from "../shopify.server";
import { sessionStorage } from "../shopify.server";
import { startFullSync } from "../lib/sync/sync.service";
import type { Route } from "./+types/api.sync";

export const action = async ({ request }: Route.ActionArgs) => {
  const { session } = await authenticate.admin(request);
  const shopDomain = session.shop;

  // Validate the offline session before kicking off background sync
  const offlineSessionId = `offline_${shopDomain}`;
  const offlineSession = await sessionStorage.loadSession(offlineSessionId);

  const offlineExpired = offlineSession
    ? !offlineSession.isActive(offlineSession.scope ?? "")
    : true;

  console.log(`[api/sync] Online session shop=${shopDomain} scope=${session.scope}`);
  console.log(`[api/sync] Offline session found=${!!offlineSession} expires=${offlineSession?.expires ?? "none"} expired=${offlineExpired}`);

  if (!offlineSession || offlineExpired) {
    console.error(`[api/sync] Offline session missing or expired for ${shopDomain}. Re-auth required.`);
    return Response.json(
      { started: false, error: "offline_session_expired", shop: shopDomain },
      { status: 401 }
    );
  }

  console.log(`[api/sync] Starting sync for ${shopDomain}`);
  await startFullSync(shopDomain);

  return Response.json({ started: true, shop: shopDomain });
};
