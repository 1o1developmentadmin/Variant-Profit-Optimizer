import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }: { request: Request }) => {
  const { topic, shop } = await authenticate.webhook(request);
  console.log(`Received ${topic} webhook for ${shop}`);

  // Delete ALL shop data in FK-safe order (48 days after uninstall, per GDPR)
  // Leaf tables first, then parent tables.
  await db.refundLineItem.deleteMany({ where: { shopDomain: shop } });
  await db.transaction.deleteMany({ where: { shopDomain: shop } });
  await db.orderLineItem.deleteMany({ where: { shopDomain: shop } });
  await db.refund.deleteMany({ where: { shopDomain: shop } });
  await db.inventoryLevel.deleteMany({ where: { shopDomain: shop } });
  await db.inventoryItem.deleteMany({ where: { shopDomain: shop } });
  await db.variantDailyMetrics.deleteMany({ where: { shopDomain: shop } });
  await db.variantScore.deleteMany({ where: { shopDomain: shop } });
  await db.recommendation.deleteMany({ where: { shopDomain: shop } });
  await db.order.deleteMany({ where: { shopDomain: shop } });
  await db.variant.deleteMany({ where: { shopDomain: shop } });
  await db.product.deleteMany({ where: { shopDomain: shop } });
  await db.syncJob.deleteMany({ where: { shopDomain: shop } });
  await db.merchantSettings.deleteMany({ where: { shopDomain: shop } });
  await db.shop.deleteMany({ where: { shopDomain: shop } });
  await db.session.deleteMany({ where: { shop } });

  return new Response();
};
