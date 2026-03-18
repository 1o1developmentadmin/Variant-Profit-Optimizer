import { authenticate } from "../shopify.server";
import db from "../db.server";
import { markUninstalled } from "../lib/db/shops.repo";

export const action = async ({ request }) => {
  const { shop, session, topic } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);

  if (session) {
    await db.session.deleteMany({ where: { shop } });
  }

  // Mark shop as uninstalled (preserves data for potential reinstall)
  await markUninstalled(shop).catch((err) => {
    console.error(`[webhook app/uninstalled] Failed to mark uninstalled for ${shop}:`, err);
  });

  return new Response();
};
