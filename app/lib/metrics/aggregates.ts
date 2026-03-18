/**
 * Sibling Comparison Rollups — TICKET-03-02
 * Computes per-product min/max metrics for normalization in scoring engine.
 */
import db from "../../db.server";
import { getVariantWindowMetrics } from "./dailyMetrics";

export interface SiblingContext {
  productId: string;
  shopDomain: string;
  isSingleVariant: boolean;
  minUnitsSold: number;
  maxUnitsSold: number;
  minRevenue: number;
  maxRevenue: number;
  minGrossProfit: number | null;
  maxGrossProfit: number | null;
  minMarginPct: number | null;
  maxMarginPct: number | null;
  minRefundRate: number;
  maxRefundRate: number;
  minStock: number;
  maxStock: number;
  minRefundPerUnit: number;
  maxRefundPerUnit: number;
}

export async function computeSiblingContext(
  productGid: string,
  shopDomain: string,
  windowDays = 30,
): Promise<SiblingContext> {
  const variants = await db.variant.findMany({
    where: { shopDomain, productGid },
  });

  const isSingleVariant = variants.length <= 1;

  // If single variant, get all variants for store-wide comparison
  const compareVariants = isSingleVariant
    ? await db.variant.findMany({ where: { shopDomain } })
    : variants;

  const metrics = await Promise.all(
    compareVariants.map(async (v: { variantGid: string }) => {
      const m = await getVariantWindowMetrics(shopDomain, v.variantGid, windowDays);
      const refundRate = m.unitsSold > 0
        ? (m.refundAmount / (m.revenue || 1)) * 100
        : 0;
      const refundPerUnit = m.unitsSold > 0 ? m.refundAmount / m.unitsSold : 0;
      const stock = m.endingStockQuantity ?? 0;
      return { ...m, refundRate, refundPerUnit, stock };
    }),
  );

  type MetricRow = (typeof metrics)[0];
  const nums = (key: keyof MetricRow) =>
    metrics.map((m: MetricRow) => Number(m[key])).filter((n: number) => !isNaN(n));

  const profitNums = metrics
    .filter((m: MetricRow) => m.grossProfit != null)
    .map((m: MetricRow) => m.grossProfit as number);

  const marginNums = metrics
    .filter((m: MetricRow) => m.marginPct != null)
    .map((m: MetricRow) => m.marginPct as number);

  return {
    productId: productGid,
    shopDomain,
    isSingleVariant,
    minUnitsSold: Math.min(...nums("unitsSold")),
    maxUnitsSold: Math.max(...nums("unitsSold")),
    minRevenue: Math.min(...nums("revenue")),
    maxRevenue: Math.max(...nums("revenue")),
    minGrossProfit: profitNums.length > 0 ? Math.min(...profitNums) : null,
    maxGrossProfit: profitNums.length > 0 ? Math.max(...profitNums) : null,
    minMarginPct: marginNums.length > 0 ? Math.min(...marginNums) : null,
    maxMarginPct: marginNums.length > 0 ? Math.max(...marginNums) : null,
    minRefundRate: Math.min(...nums("refundRate")),
    maxRefundRate: Math.max(...nums("refundRate")),
    minStock: Math.min(...nums("stock")),
    maxStock: Math.max(...nums("stock")),
    minRefundPerUnit: Math.min(...nums("refundPerUnit")),
    maxRefundPerUnit: Math.max(...nums("refundPerUnit")),
  };
}
