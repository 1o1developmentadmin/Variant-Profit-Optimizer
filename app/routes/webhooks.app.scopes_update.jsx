import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }) => {
  const { payload, session, topic, shop } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);
  const current = payload.current;

  if (session) {
    await db.session.update({
      where: { id: session.id },
      data: { scope: current.toString() },
    });
  }

  const scopes = (Array.isArray(current) ? current : [current]).map((s) =>
    String(s).trim(),
  );
  const hasAllOrdersScope = scopes.includes("read_all_orders");
  await db.shop.upsert({
    where: { shopDomain: shop },
    update: { hasAllOrdersScope },
    create: { shopDomain: shop, hasAllOrdersScope },
  });

  return new Response();
};
