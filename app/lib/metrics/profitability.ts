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
