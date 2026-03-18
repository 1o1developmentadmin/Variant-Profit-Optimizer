/**
 * Profitability Service — TICKET-03-05
 * Per-variant and per-product profit summaries.
 * All gross profit labeled "Gross profit (excl. fees & shipping)" per PRD 9.4.
 */
import db from "../../db.server";
import { getVariantWindowMetrics } from "./dailyMetrics";

export const GROSS_PROFIT_LABEL = "Gross profit (excl. fees & shipping)";

export interface VariantProfitability {
  variantGid: string;
  revenue: number;
  grossProfit: number | null;       // null when no cost data
  marginPct: number | null;         // null when no cost data
  grossProfitLabel: string;
  hasCostData: boolean;
  costEstimated: boolean;
}

export interface ProductProfitability {
  productGid: string;
  revenue: number;
  grossProfit: number | null;
  marginPct: number | null;
  grossProfitLabel: string;
  costCoveragePct: number;
  variantCount: number;
  variantsWithCostData: number;
  variantProfits: VariantProfitability[];
}

export async function getVariantProfitability(
  shopDomain: string,
  variantGid: string,
  windowDays = 30,
): Promise<VariantProfitability> {
  const metrics = await getVariantWindowMetrics(shopDomain, variantGid, windowDays);
  const invItem = await db.inventoryItem.findFirst({
    where: { shopDomain, variantGid },
    select: { hasCostData: true },
  });
  const hasCostData = invItem?.hasCostData ?? false;

  return {
    variantGid,
    revenue: metrics.revenue,
    grossProfit: hasCostData ? metrics.grossProfit : null,
    marginPct: hasCostData ? metrics.marginPct : null,
    grossProfitLabel: GROSS_PROFIT_LABEL,
    hasCostData,
    costEstimated: false,
  };
}

/**
 * Batch profitability for multiple variants — 2 queries total regardless of count.
 * Eliminates N+1 patterns in list endpoints.
 */
export async function getBatchVariantProfitability(
  shopDomain: string,
  variantGids: string[],
  windowDays = 30,
): Promise<Map<string, VariantProfitability>> {
  if (variantGids.length === 0) return new Map();

  const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);

  const [allMetrics, allInventoryItems] = await Promise.all([
    db.variantDailyMetrics.findMany({
      where: { shopDomain, variantGid: { in: variantGids }, date: { gte: since } },
    }),
    db.inventoryItem.findMany({
      where: { shopDomain, variantGid: { in: variantGids } },
      select: { variantGid: true, hasCostData: true },
    }),
  ]);

  const hasCostDataMap = new Map<string, boolean>();
  for (const item of allInventoryItems) {
    if (item.variantGid) hasCostDataMap.set(item.variantGid, item.hasCostData);
  }

  const metricsByVariant = new Map<string, typeof allMetrics>();
  for (const m of allMetrics) {
    const bucket = metricsByVariant.get(m.variantGid) ?? [];
    bucket.push(m);
    metricsByVariant.set(m.variantGid, bucket);
  }

  const result = new Map<string, VariantProfitability>();
  for (const variantGid of variantGids) {
    const rows = metricsByVariant.get(variantGid) ?? [];
    const hasCostData = hasCostDataMap.get(variantGid) ?? false;
    const revenue = rows.reduce((s: number, r: { revenue: number }) => s + r.revenue, 0);
    const grossProfit = hasCostData
      ? rows.reduce((s: number, r: { grossProfitAmount: number | null }) => s + (r.grossProfitAmount ?? 0), 0)
      : null;
    const marginPct = hasCostData && revenue > 0
      ? (grossProfit! / revenue) * 100
      : null;

    result.set(variantGid, {
      variantGid,
      revenue,
      grossProfit,
      marginPct,
      grossProfitLabel: GROSS_PROFIT_LABEL,
      hasCostData,
      costEstimated: false,
    });
  }

  return result;
}

/**
 * Batch profitability for multiple products — 3 queries total regardless of product/variant count.
 * Eliminates N+1 patterns in the products list endpoint.
 */
export async function getBatchProductProfitability(
  shopDomain: string,
  productGids: string[],
  windowDays = 30,
): Promise<Map<string, ProductProfitability>> {
  if (productGids.length === 0) return new Map();

  const allVariants = await db.variant.findMany({
    where: { shopDomain, productGid: { in: productGids } },
    select: { variantGid: true, productGid: true },
  });

  const variantGids = allVariants.map((v: { variantGid: string }) => v.variantGid);
  const profitMap = await getBatchVariantProfitability(shopDomain, variantGids, windowDays);

  const variantsByProduct = new Map<string, Array<{ variantGid: string; productGid: string }>>();
  for (const v of allVariants) {
    const bucket = variantsByProduct.get(v.productGid) ?? [];
    bucket.push(v);
    variantsByProduct.set(v.productGid, bucket);
  }

  const result = new Map<string, ProductProfitability>();
  for (const productGid of productGids) {
    const variants = variantsByProduct.get(productGid) ?? [];
    const variantProfits = variants.map((v) =>
      profitMap.get(v.variantGid) ?? {
        variantGid: v.variantGid,
        revenue: 0,
        grossProfit: null,
        marginPct: null,
        grossProfitLabel: GROSS_PROFIT_LABEL,
        hasCostData: false,
        costEstimated: false,
      },
    );

    const totalRevenue = variantProfits.reduce((s: number, v: VariantProfitability) => s + v.revenue, 0);
    const withCost = variantProfits.filter((v: VariantProfitability) => v.hasCostData);
    const totalGrossProfit = withCost.length > 0
      ? withCost.reduce((s: number, v: VariantProfitability) => s + (v.grossProfit ?? 0), 0)
      : null;
    const marginPct = totalGrossProfit != null && totalRevenue > 0
      ? (totalGrossProfit / totalRevenue) * 100
      : null;
    const costCoveragePct = variants.length > 0
      ? (withCost.length / variants.length) * 100
      : 0;

    result.set(productGid, {
      productGid,
      revenue: totalRevenue,
      grossProfit: totalGrossProfit,
      marginPct,
      grossProfitLabel: GROSS_PROFIT_LABEL,
      costCoveragePct,
      variantCount: variants.length,
      variantsWithCostData: withCost.length,
      variantProfits,
    });
  }

  return result;
}

export async function getProductProfitability(
  shopDomain: string,
  productGid: string,
  windowDays = 30,
): Promise<ProductProfitability> {
  const variants = await db.variant.findMany({
    where: { shopDomain, productGid },
    select: { variantGid: true },
  });

  const variantProfits = await Promise.all(
    variants.map((v: { variantGid: string }) =>
      getVariantProfitability(shopDomain, v.variantGid, windowDays),
    ),
  );

  const totalRevenue = variantProfits.reduce((s: number, v: VariantProfitability) => s + v.revenue, 0);
  const withCost = variantProfits.filter((v: VariantProfitability) => v.hasCostData);
  const totalGrossProfit = withCost.length > 0
    ? withCost.reduce((s: number, v: VariantProfitability) => s + (v.grossProfit ?? 0), 0)
    : null;
  const marginPct = totalGrossProfit != null && totalRevenue > 0
    ? (totalGrossProfit / totalRevenue) * 100
    : null;
  const costCoveragePct = variants.length > 0
    ? (withCost.length / variants.length) * 100
    : 0;

  return {
    productGid,
    revenue: totalRevenue,
    grossProfit: totalGrossProfit,
    marginPct,
    grossProfitLabel: GROSS_PROFIT_LABEL,
    costCoveragePct,
    variantCount: variants.length,
    variantsWithCostData: withCost.length,
    variantProfits,
  };
}
