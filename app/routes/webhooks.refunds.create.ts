/**
 * Webhook: refunds/create
 * Upserts a refund and its line items, attributing variantGid via line_item.variant_id.
 */
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }: { request: Request }) => {
  const { shop, payload } = await authenticate.webhook(request);

  setTimeout(() => void processRefundCreate(shop, payload));

  return new Response(null, { status: 200 });
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function processRefundCreate(shopDomain: string, payload: any) {
  try {
    const refundGid = `gid://shopify/Refund/${payload.id}`;
    const orderGid = `gid://shopify/Order/${payload.order_id}`;
    const currency = payload.currency ?? null;

    // Only upsert if the parent order exists
    const orderExists = await db.order.findUnique({
      where: { shopDomain_orderGid: { shopDomain, orderGid } },
      select: { id: true },
    });
    if (!orderExists) return;

    await db.refund.upsert({
      where: { shopDomain_refundGid: { shopDomain, refundGid } },
      update: {
        orderGid,
        note: payload.note ?? null,
        currencyCode: currency,
        processedAt: payload.processed_at ? new Date(payload.processed_at) : null,
        createdAtShopify: payload.created_at ? new Date(payload.created_at) : null,
      },
      create: {
        shopDomain,
        refundGid,
        orderGid,
        note: payload.note ?? null,
        currencyCode: currency,
        createdAtShopify: payload.created_at ? new Date(payload.created_at) : null,
        processedAt: payload.processed_at ? new Date(payload.processed_at) : null,
      },
    });

    const refundLineItems: Array<Record<string, unknown>> =
      payload.refund_line_items ?? [];

    for (const rli of refundLineItems) {
      const refundLineItemGid = `gid://shopify/RefundLineItem/${rli.id}`;
      const lineItemId = rli.line_item_id;
      const orderLineItemGid = lineItemId
        ? `gid://shopify/LineItem/${lineItemId}`
        : null;

      // Extract variantGid from the nested line_item object if available
      const lineItemObj = rli.line_item as Record<string, unknown> | null ?? null;
      const variantId = lineItemObj?.variant_id ?? null;
      const variantGid = variantId
        ? `gid://shopify/ProductVariant/${variantId}`
        : null;

      await db.refundLineItem.upsert({
        where: { shopDomain_refundLineItemGid: { shopDomain, refundLineItemGid } },
        update: {
          refundGid,
          orderLineItemGid,
          variantGid,
          quantity: (rli.quantity as number) ?? 0,
          subtotalAmount: rli.subtotal ? parseFloat(rli.subtotal as string) : null,
          totalTaxAmount: rli.total_tax ? parseFloat(rli.total_tax as string) : null,
          restockType: (rli.restock_type as string) ?? null,
        },
        create: {
          shopDomain,
          refundLineItemGid,
          refundGid,
          orderLineItemGid,
          variantGid,
          quantity: (rli.quantity as number) ?? 0,
          subtotalAmount: rli.subtotal ? parseFloat(rli.subtotal as string) : null,
          totalTaxAmount: rli.total_tax ? parseFloat(rli.total_tax as string) : null,
          restockType: (rli.restock_type as string) ?? null,
        },
      });
    }
  } catch (err) {
    console.error(`[webhook refunds/create] Error for ${shopDomain}:`, err);
  }
}
