/**
 * GET /api/products — Product list with profitability data (TICKET-03-07)
 * GET /api/products/:id — Product detail with cost coverage banner
 */
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { getProductProfitability, GROSS_PROFIT_LABEL } from "../lib/metrics/profitability";
import type { Route } from "./+types/api.products";

export const loader = async ({ request }: Route.LoaderArgs) => {
  const { session } = await authenticate.admin(request);
  const shopDomain = session.shop;

  const url = new URL(request.url);
  const windowDays = parseInt(url.searchParams.get("window") ?? "30", 10);

  const products = await db.product.findMany({
    where: { shopDomain, status: "ACTIVE" },
    orderBy: { title: "asc" },
    select: {
      id: true,
      productGid: true,
      title: true,
      handle: true,
      productType: true,
      vendor: true,
      status: true,
    },
  });

  const rows = await Promise.all(
    products.map(async (p: { productGid: string; id: string; title: string; handle: string | null; productType: string | null; vendor: string | null; status: string | null }) => {
      const profit = await getProductProfitability(shopDomain, p.productGid, windowDays);
      return {
        id: p.id,
        productGid: p.productGid,
        title: p.title,
        handle: p.handle,
        productType: p.productType,
        vendor: p.vendor,
        status: p.status,
        revenue: profit.revenue,
        grossProfit: profit.grossProfit,
        grossProfitLabel: GROSS_PROFIT_LABEL,
        marginPct: profit.marginPct,
        variantCount: profit.variantCount,
        costCoveragePct: profit.costCoveragePct,
        missingCostVariants: profit.variantCount - profit.variantsWithCostData,
      };
    }),
  );

  return Response.json({ products: rows, windowDays });
};
