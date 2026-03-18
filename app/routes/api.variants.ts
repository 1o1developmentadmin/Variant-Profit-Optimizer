/**
 * GET /api/variants — Variant list with profitability data (TICKET-03-07)
 */
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { getVariantProfitability, GROSS_PROFIT_LABEL } from "../lib/metrics/profitability";
import type { Route } from "./+types/api.variants";

export const loader = async ({ request }: Route.LoaderArgs) => {
  const { session } = await authenticate.admin(request);
  const shopDomain = session.shop;

  const url = new URL(request.url);
  const productGid = url.searchParams.get("productGid");
  const windowDays = parseInt(url.searchParams.get("window") ?? "30", 10);

  const where = productGid
    ? { shopDomain, productGid }
    : { shopDomain };

  const variants = await db.variant.findMany({
    where,
    orderBy: [{ productGid: "asc" }, { title: "asc" }],
    select: {
      id: true,
      variantGid: true,
      productGid: true,
      title: true,
      sku: true,
      price: true,
      inventoryQuantity: true,
    },
  });

  const rows = await Promise.all(
    variants.map(async (v: { id: string; variantGid: string; productGid: string; title: string; sku: string | null; price: number; inventoryQuantity: number | null }) => {
      const profit = await getVariantProfitability(shopDomain, v.variantGid, windowDays);
      return {
        id: v.id,
        variantGid: v.variantGid,
        productGid: v.productGid,
        title: v.title,
        sku: v.sku,
        price: v.price,
        inventoryQuantity: v.inventoryQuantity,
        revenue: profit.revenue,
        grossProfit: profit.hasCostData ? profit.grossProfit : null,
        marginPct: profit.hasCostData ? profit.marginPct : null,
        grossProfitLabel: GROSS_PROFIT_LABEL,
        hasCostData: profit.hasCostData,
      };
    }),
  );

  return Response.json({ variants: rows, windowDays });
};
