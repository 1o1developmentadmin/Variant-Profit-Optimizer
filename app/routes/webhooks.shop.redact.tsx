import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }: { request: Request }) => {
  const { topic, shop } = await authenticate.webhook(request);
  console.log(`Received ${topic} webhook for ${shop}`);

  // Remove all shop data on shop redact (48 days after uninstall)
  await db.merchantSettings.deleteMany({ where: { shopDomain: shop } });
  await db.shop.deleteMany({ where: { shopDomain: shop } });

  return new Response();
};
