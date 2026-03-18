/**
 * Webhook: orders/create
 * Upserts the new order and its line items.
 */
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }: { request: Request }) => {
  const { shop, payload } = await authenticate.webhook(request);

  // Acknowledge immediately — process async
  setTimeout(() => void processOrderCreate(shop, payload));

  return new Response(null, { status: 200 });
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function processOrderCreate(shopDomain: string, payload: any) {
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

    // Upsert line items
    const lineItems: Array<Record<string, unknown>> = payload.line_items ?? [];
    for (const li of lineItems) {
      const lineItemGid = `gid://shopify/LineItem/${li.id}`;
      const variantId = li.variant_id;
      const variantGid = variantId ? `gid://shopify/ProductVariant/${variantId}` : null;

      await db.orderLineItem.upsert({
        where: { shopDomain_lineItemGid: { shopDomain, lineItemGid } },
        update: {
          orderGid,
          variantGid,
          title: (li.title as string) ?? null,
          variantTitle: (li.variant_title as string) ?? null,
          quantity: (li.quantity as number) ?? 0,
          price: li.price ? parseFloat(li.price as string) : 0,
          sku: (li.sku as string) ?? null,
          isGiftCard: (li.gift_card as boolean) ?? null,
          requiresShipping: (li.requires_shipping as boolean) ?? null,
        },
        create: {
          shopDomain,
          orderGid,
          lineItemGid,
          variantGid,
          title: (li.title as string) ?? null,
          variantTitle: (li.variant_title as string) ?? null,
          quantity: (li.quantity as number) ?? 0,
          price: li.price ? parseFloat(li.price as string) : 0,
          sku: (li.sku as string) ?? null,
          isGiftCard: (li.gift_card as boolean) ?? null,
          requiresShipping: (li.requires_shipping as boolean) ?? null,
        },
      });
    }
  } catch (err) {
    console.error(`[webhook orders/create] Error for ${shopDomain}:`, err);
  }
}
