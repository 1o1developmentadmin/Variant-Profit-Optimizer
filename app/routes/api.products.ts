/**
 * GET /api/products — Product list with profitability data (TICKET-03-07)
 * GET /api/products/:id — Product detail with cost coverage banner
 */
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { getBatchProductProfitability, getProductProfitability, GROSS_PROFIT_LABEL } from "../lib/metrics/profitability";
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

  const productGids = products.map((p: { productGid: string }) => p.productGid);
  const profitMap = await getBatchProductProfitability(shopDomain, productGids, windowDays);

  const rows = products.map((p: { productGid: string; id: string; title: string; handle: string | null; productType: string | null; vendor: string | null; status: string | null }) => {
    const profit = profitMap.get(p.productGid);
    return {
      id: p.id,
      productGid: p.productGid,
      title: p.title,
      handle: p.handle,
      productType: p.productType,
      vendor: p.vendor,
      status: p.status,
      revenue: profit?.revenue ?? 0,
      grossProfit: profit?.grossProfit ?? null,
      grossProfitLabel: GROSS_PROFIT_LABEL,
      marginPct: profit?.marginPct ?? null,
      variantCount: profit?.variantCount ?? 0,
      costCoveragePct: profit?.costCoveragePct ?? 0,
      missingCostVariants: (profit?.variantCount ?? 0) - (profit?.variantsWithCostData ?? 0),
    };
  });

  return Response.json({ products: rows, windowDays });
};
