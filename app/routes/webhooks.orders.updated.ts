/**
 * Webhook: orders/updated
 * Updates an existing order record (financial/fulfillment status, cancellation, etc.)
 */
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }: { request: Request }) => {
  const { shop, payload } = await authenticate.webhook(request);

  setTimeout(() => void processOrderUpdate(shop, payload));

  return new Response(null, { status: 200 });
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function processOrderUpdate(shopDomain: string, payload: any) {
  try {
    const orderGid = `gid://shopify/Order/${payload.id}`;

    await db.order.upsert({
      where: { shopDomain_orderGid: { shopDomain, orderGid } },
      update: {
        name: payload.name ?? null,
        email: payload.email ?? null,
        financialStatus: payload.financial_status ?? null,
        fulfillmentStatus: payload.fulfillment_status ?? null,
        totalPriceAmount: payload.total_price ? parseFloat(payload.total_price) : null,
        subtotalAmount: payload.subtotal_price ? parseFloat(payload.subtotal_price) : null,
        currencyCode: payload.currency ?? null,
        isTest: payload.test ?? false,
        processedAt: payload.processed_at ? new Date(payload.processed_at) : null,
        cancelledAtShopify: payload.cancelled_at ? new Date(payload.cancelled_at) : null,
        closedAt: payload.closed_at ? new Date(payload.closed_at) : null,
        updatedAtShopify: payload.updated_at ? new Date(payload.updated_at) : null,
      },
      create: {
        shopDomain,
        orderGid,
        name: payload.name ?? null,
        email: payload.email ?? null,
        financialStatus: payload.financial_status ?? null,
        fulfillmentStatus: payload.fulfillment_status ?? null,
        totalPriceAmount: payload.total_price ? parseFloat(payload.total_price) : null,
        subtotalAmount: payload.subtotal_price ? parseFloat(payload.subtotal_price) : null,
        currencyCode: payload.currency ?? null,
        isTest: payload.test ?? false,
        processedAt: payload.processed_at ? new Date(payload.processed_at) : null,
        cancelledAtShopify: payload.cancelled_at ? new Date(payload.cancelled_at) : null,
        closedAt: payload.closed_at ? new Date(payload.closed_at) : null,
        createdAtShopify: payload.created_at ? new Date(payload.created_at) : null,
        updatedAtShopify: payload.updated_at ? new Date(payload.updated_at) : null,
      },
    });
  } catch (err) {
    console.error(`[webhook orders/updated] Error for ${shopDomain}:`, err);
  }
}
