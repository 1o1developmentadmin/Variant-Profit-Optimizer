/**
 * GET /api/products/:id — Product detail with variant breakdown and cost coverage (TICKET-03-07)
 */
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { getProductProfitability, GROSS_PROFIT_LABEL } from "../lib/metrics/profitability";
import { computeInventoryMetrics } from "../lib/metrics/inventory";
import type { Route } from "./+types/api.products.$id";

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const { session } = await authenticate.admin(request);
  const shopDomain = session.shop;
  const productId = params.id;

  const product = await db.product.findFirst({
    where: { shopDomain, id: productId },
  });

  if (!product) {
    return Response.json({ error: "Product not found" }, { status: 404 });
  }

  const url = new URL(request.url);
  const windowDays = parseInt(url.searchParams.get("window") ?? "30", 10);

  const [profit, variants] = await Promise.all([
    getProductProfitability(shopDomain, product.productGid, windowDays),
    db.variant.findMany({
      where: { shopDomain, productGid: product.productGid },
      orderBy: { title: "asc" },
    }),
  ]);

  const variantDetails = await Promise.all(
    variants.map(async (v: { variantGid: string; title: string; sku: string | null; price: number }) => {
      const vProfit = profit.variantProfits.find((vp: { variantGid: string }) => vp.variantGid === v.variantGid);
      const inv = await computeInventoryMetrics(shopDomain, v.variantGid);
      return {
        variantGid: v.variantGid,
        title: v.title,
        sku: v.sku,
        price: v.price,
        revenue: vProfit?.revenue ?? 0,
        grossProfit: vProfit?.grossProfit ?? null,
        marginPct: vProfit?.marginPct ?? null,
        hasCostData: vProfit?.hasCostData ?? false,
        currentStock: inv.currentStock,
        daysOfStockLeft: inv.daysOfStockLeft,
        stockHealth: inv.stockHealth,
      };
    }),
  );

  const missingCostCount = profit.variantCount - profit.variantsWithCostData;

  return Response.json({
    product: {
      id: product.id,
      productGid: product.productGid,
      title: product.title,
      handle: product.handle,
      status: product.status,
    },
    profitability: {
      revenue: profit.revenue,
      grossProfit: profit.grossProfit,
      marginPct: profit.marginPct,
      grossProfitLabel: GROSS_PROFIT_LABEL,
      costCoveragePct: profit.costCoveragePct,
    },
    variants: variantDetails,
    costDataBanner: missingCostCount > 0
      ? `${missingCostCount} variant${missingCostCount > 1 ? "s are" : " is"} missing cost data. Profit scores will be unavailable for ${missingCostCount > 1 ? "them" : "it"}.`
      : null,
    windowDays,
  });
};
