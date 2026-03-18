/**
 * Daily Metrics Service — TICKET-03-01
 * Aggregates raw order/refund/inventory data into variant_daily_metrics.
 * Gross profit excludes payment fees and shipping (PRD section 9.4).
 */
import db from "../../db.server";

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function startOfDay(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00.000Z`);
}

export async function recomputeAllMetricsForShop(shopDomain: string): Promise<number> {
  // --- Load raw data ---
  const [lineItems, refundLineItems, inventoryItems, inventoryLevels] = await Promise.all([
    db.orderLineItem.findMany({
      where: { shopDomain, variantGid: { not: null } },
      include: { order: { select: { processedAt: true, orderGid: true } } },
    }),
    db.refundLineItem.findMany({
      where: { shopDomain, variantGid: { not: null } },
      include: { refund: { select: { createdAtShopify: true } } },
    }),
    db.inventoryItem.findMany({
      where: { shopDomain, variantGid: { not: null } },
    }),
    db.inventoryLevel.findMany({ where: { shopDomain } }),
  ]);

  // Cost map: variantGid → unit cost (null if no data)
  const costMap = new Map<string, number | null>();
  const trackedMap = new Map<string, boolean>(); // inventoryItemGid → tracked
  for (const item of inventoryItems) {
    if (item.variantGid) {
      costMap.set(item.variantGid, item.hasCostData ? (item.unitCostAmount ?? null) : null);
      trackedMap.set(item.inventoryItemGid, item.tracked);
    }
  }

  // Current stock map: inventoryItemGid → total available across all locations
  const stockMap = new Map<string, number>();
  for (const level of inventoryLevels) {
    const existing = stockMap.get(level.inventoryItemGid) ?? 0;
    stockMap.set(level.inventoryItemGid, existing + level.available);
  }

  // inventoryItemGid per variant (from inventoryItems)
  const variantInvItemGid = new Map<string, string>();
  for (const item of inventoryItems) {
    if (item.variantGid) variantInvItemGid.set(item.variantGid, item.inventoryItemGid);
  }

  // --- Group line items by variant + day ---
  // Map<variantGid, Map<dateStr, { orderGids: Set<string>, totalQty: number, totalRevenue: number }>>
  type DayData = { orderGids: Set<string>; totalQty: number; totalRevenue: number };
  const saleMap = new Map<string, Map<string, DayData>>();

  for (const li of lineItems) {
    const variantGid = li.variantGid!;
    const processedAt = li.order.processedAt;
    if (!processedAt) continue;
    const dateStr = toDateStr(processedAt);

    let variantMap = saleMap.get(variantGid);
    if (!variantMap) { variantMap = new Map(); saleMap.set(variantGid, variantMap); }

    let day = variantMap.get(dateStr);
    if (!day) { day = { orderGids: new Set(), totalQty: 0, totalRevenue: 0 }; variantMap.set(dateStr, day); }

    day.orderGids.add(li.order.orderGid);
    day.totalQty += li.quantity;
    // revenue = price × quantity − totalDiscountAmount
    day.totalRevenue += li.price * li.quantity - (li.totalDiscountAmount ?? 0);
  }

  // --- Group refunds by variant + day ---
  // Map<variantGid, Map<dateStr, { totalRefundAmount: number, totalRefundQty: number }>>
  type RefundDay = { totalRefundAmount: number; totalRefundQty: number };
  const refundMap = new Map<string, Map<string, RefundDay>>();

  for (const rli of refundLineItems) {
    const variantGid = rli.variantGid!;
    const createdAt = rli.refund.createdAtShopify;
    if (!createdAt) continue;
    const dateStr = toDateStr(createdAt);

    let variantMap = refundMap.get(variantGid);
    if (!variantMap) { variantMap = new Map(); refundMap.set(variantGid, variantMap); }

    let day = variantMap.get(dateStr);
    if (!day) { day = { totalRefundAmount: 0, totalRefundQty: 0 }; variantMap.set(dateStr, day); }

    day.totalRefundAmount += rli.subtotalAmount ?? 0;
    day.totalRefundQty += rli.quantity;
  }

  // Collect all variant GIDs that have any data
  const allVariantGids = new Set<string>([...saleMap.keys(), ...refundMap.keys()]);

  let upsertCount = 0;

  for (const variantGid of allVariantGids) {
    const saleDays = saleMap.get(variantGid) ?? new Map<string, DayData>();
    const refundDays = refundMap.get(variantGid) ?? new Map<string, RefundDay>();
    const unitCost = costMap.get(variantGid) ?? null;
    const hasCost = unitCost != null;
    const invItemGid = variantInvItemGid.get(variantGid);
    const currentStock = invItemGid ? (stockMap.get(invItemGid) ?? 0) : 0;

    // Collect all unique days
    const allDays = new Set<string>([...saleDays.keys(), ...refundDays.keys()]);

    // Build sorted array of (dateStr, unitsSold) for rolling calcs
    const sortedDays: Array<{ dateStr: string; unitsSold: number }> = [];

    for (const dateStr of allDays) {
      const sale = saleDays.get(dateStr);
      const refund = refundDays.get(dateStr);

      const ordersCount = sale?.orderGids.size ?? 0;
      const unitsSold = sale?.totalQty ?? 0;
      const revenue = sale?.totalRevenue ?? 0;
      const refundAmount = refund?.totalRefundAmount ?? 0;
      const refundCount = refund?.totalRefundQty ?? 0;
      const cogsAmount = hasCost ? (unitCost! * unitsSold) : 0;
      const grossProfitAmount = hasCost ? revenue - cogsAmount - refundAmount : null;
      const marginPct = (hasCost && revenue > 0) ? (grossProfitAmount! / revenue) * 100 : null;

      sortedDays.push({ dateStr, unitsSold });

      await db.variantDailyMetrics.upsert({
        where: {
          shopDomain_variantGid_date: {
            shopDomain,
            variantGid,
            date: startOfDay(dateStr),
          },
        },
        update: {
          ordersCount,
          unitsSold,
          revenue,
          cogsAmount,
          refundCount,
          refundAmount,
          grossProfitAmount,
          marginPct,
          endingStockQuantity: currentStock,
        },
        create: {
          shopDomain,
          variantGid,
          date: startOfDay(dateStr),
          ordersCount,
          unitsSold,
          revenue,
          cogsAmount,
          refundCount,
          refundAmount,
          grossProfitAmount,
          marginPct,
          endingStockQuantity: currentStock,
        },
      });
      upsertCount++;
    }

    // --- Rolling fields: load all metric rows for this variant (sorted by date) ---
    const allRows = await db.variantDailyMetrics.findMany({
      where: { shopDomain, variantGid },
      orderBy: { date: "asc" },
      select: { id: true, date: true, unitsSold: true },
    });

    // Compute velocity and 14d rolling for each row
    for (let i = 0; i < allRows.length; i++) {
      const row = allRows[i];
      // 7d window: days i-6 to i
      const slice7 = allRows.slice(Math.max(0, i - 6), i + 1);
      const salesVelocity7d = slice7.reduce((s: number, r: { unitsSold: number }) => s + r.unitsSold, 0) / 7;

      // 30d window
      const slice30 = allRows.slice(Math.max(0, i - 29), i + 1);
      const salesVelocity30d = slice30.reduce((s: number, r: { unitsSold: number }) => s + r.unitsSold, 0) / 30;

      // 14d rolling (only update the LAST row per variant with aggregated totals)
      // We'll compute these for the most recent row; others can stay at 0
      const isLast = i === allRows.length - 1;
      let unitsSoldLast14d = 0;
      let unitsSoldPrior14d = 0;
      if (isLast) {
        const last14 = allRows.slice(Math.max(0, allRows.length - 14));
        const prior14 = allRows.slice(Math.max(0, allRows.length - 28), Math.max(0, allRows.length - 14));
        unitsSoldLast14d = last14.reduce((s: number, r: { unitsSold: number }) => s + r.unitsSold, 0);
        unitsSoldPrior14d = prior14.reduce((s: number, r: { unitsSold: number }) => s + r.unitsSold, 0);
      }

      await db.variantDailyMetrics.update({
        where: { id: row.id },
        data: {
          salesVelocity7d,
          salesVelocity30d,
          ...(isLast ? { unitsSoldLast14d, unitsSoldPrior14d } : {}),
        },
      });
    }
  }

  return upsertCount;
}

/**
 * Get the latest rolling metrics for a variant.
 */
export async function getVariantRollingMetrics(shopDomain: string, variantGid: string) {
  return db.variantDailyMetrics.findFirst({
    where: { shopDomain, variantGid },
    orderBy: { date: "desc" },
  });
}

/**
 * Get aggregated metrics for a variant over a window (last N days).
 */
export async function getVariantWindowMetrics(
  shopDomain: string,
  variantGid: string,
  windowDays = 30,
) {
  const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);
  const rows = await db.variantDailyMetrics.findMany({
    where: { shopDomain, variantGid, date: { gte: since } },
  });
  const totalRevenue = rows.reduce((s: number, r: { revenue: number }) => s + r.revenue, 0);
  const totalUnitsSold = rows.reduce((s: number, r: { unitsSold: number }) => s + r.unitsSold, 0);
  const totalRefundAmount = rows.reduce((s: number, r: { refundAmount: number }) => s + r.refundAmount, 0);
  const totalCogsAmount = rows.reduce((s: number, r: { cogsAmount: number }) => s + r.cogsAmount, 0);
  const hasCostData = rows.some((r: { grossProfitAmount: number | null }) => r.grossProfitAmount != null);
  const totalGrossProfit = hasCostData
    ? rows.reduce((s: number, r: { grossProfitAmount: number | null }) => s + (r.grossProfitAmount ?? 0), 0)
    : null;
  const marginPct = hasCostData && totalRevenue > 0 ? (totalGrossProfit! / totalRevenue) * 100 : null;
  const latest = rows.sort((a: { date: Date }, b: { date: Date }) => b.date.getTime() - a.date.getTime())[0];

  return {
    revenue: totalRevenue,
    unitsSold: totalUnitsSold,
    refundAmount: totalRefundAmount,
    cogsAmount: totalCogsAmount,
    grossProfit: totalGrossProfit,
    marginPct,
    hasCostData,
    salesVelocity7d: latest?.salesVelocity7d ?? 0,
    salesVelocity30d: latest?.salesVelocity30d ?? 0,
    unitsSoldLast14d: latest?.unitsSoldLast14d ?? 0,
    unitsSoldPrior14d: latest?.unitsSoldPrior14d ?? 0,
    endingStockQuantity: latest?.endingStockQuantity ?? null,
  };
}
