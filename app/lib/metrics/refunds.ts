/**
 * Refund-Adjusted Metrics — TICKET-03-03
 */
import db from "../../db.server";

export interface RefundMetrics {
  variantGid: string;
  refundRatePct: number;   // refunded_units / sold_units × 100
  refundAmountPerUnit: number;
  netRevenue: number;      // gross revenue - refund amount
  totalRefundAmount: number;
  totalUnitsSold: number;
  totalRefundedUnits: number;
}

export async function computeRefundMetrics(
  shopDomain: string,
  variantGid: string,
  windowDays = 30,
): Promise<RefundMetrics> {
  const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);

  const [lineItems, refundLineItems] = await Promise.all([
    db.orderLineItem.findMany({
      where: { shopDomain, variantGid },
      include: { order: { select: { processedAt: true } } },
    }),
    db.refundLineItem.findMany({
      where: { shopDomain, variantGid },
      include: { refund: { select: { createdAtShopify: true } } },
    }),
  ]);

  const windowLineItems = lineItems.filter(
    (li: { order: { processedAt: Date | null } }) =>
      li.order.processedAt && li.order.processedAt >= since,
  );
  const windowRefunds = refundLineItems.filter(
    (rli: { refund: { createdAtShopify: Date | null } }) =>
      rli.refund.createdAtShopify && rli.refund.createdAtShopify >= since,
  );

  const totalUnitsSold = windowLineItems.reduce(
    (s: number, li: { quantity: number }) => s + li.quantity, 0,
  );
  const totalRefundedUnits = windowRefunds.reduce(
    (s: number, rli: { quantity: number }) => s + rli.quantity, 0,
  );
  const totalRevenue = windowLineItems.reduce(
    (s: number, li: { price: number; quantity: number; totalDiscountAmount: number | null }) =>
      s + li.price * li.quantity - (li.totalDiscountAmount ?? 0),
    0,
  );
  const totalRefundAmount = windowRefunds.reduce(
    (s: number, rli: { subtotalAmount: number | null }) => s + (rli.subtotalAmount ?? 0), 0,
  );

  const refundRatePct = totalUnitsSold > 0
    ? (totalRefundedUnits / totalUnitsSold) * 100
    : 0;
  const refundAmountPerUnit = totalUnitsSold > 0
    ? totalRefundAmount / totalUnitsSold
    : 0;
  const netRevenue = totalRevenue - totalRefundAmount;

  return {
    variantGid,
    refundRatePct,
    refundAmountPerUnit,
    netRevenue,
    totalRefundAmount,
    totalUnitsSold,
    totalRefundedUnits,
  };
}
