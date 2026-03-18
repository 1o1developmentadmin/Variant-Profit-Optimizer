import { useState } from "react";
import { useLoaderData, useNavigate } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import type { Route } from "./+types/app.products";
import { getProductProfitability } from "../lib/metrics/profitability";
import { ProductsTable } from "../components/products/ProductsTable";

export const loader = async ({ request }: Route.LoaderArgs) => {
  const { session } = await authenticate.admin(request);
  const shopDomain = session.shop;

  const url = new URL(request.url);
  const windowDays = parseInt(url.searchParams.get("window") ?? "30", 10);

  const rawProducts = await db.product.findMany({
    where: { shopDomain, status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      variants: {
        select: { variantGid: true },
      },
    },
  });

  const products = await Promise.all(
    rawProducts.map(async (p: { id: string; title: string; productGid: string; variants: Array<{ variantGid: string }> }) => {
      let revenue = 0;
      let grossProfit: number | null = null;
      let marginPct: number | null = null;
      let costCoveragePct = 0;
      let missingCostVariants = 0;

      try {
        const profitability = await getProductProfitability(shopDomain, p.productGid, windowDays);
        revenue = profitability.revenue;
        grossProfit = profitability.grossProfit;
        marginPct = profitability.marginPct;
        costCoveragePct = profitability.costCoveragePct;
        missingCostVariants = profitability.variantCount - profitability.variantsWithCostData;
      } catch {
        missingCostVariants = p.variants.length;
      }

      return {
        id: p.id,
        title: p.title,
        variantCount: p.variants.length,
        revenue,
        grossProfit,
        marginPct,
        costCoveragePct,
        missingCostVariants,
      };
    }),
  );

  return { products, windowDays };
};

interface ProductRow {
  id: string;
  title: string;
  variantCount: number;
  revenue: number;
  grossProfit: number | null;
  marginPct: number | null;
  costCoveragePct: number;
  missingCostVariants: number;
}

export default function Products() {
  const { products } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  function handleRowClick(product: ProductRow) {
    navigate(`/app/products/${product.id}`);
  }

  return (
    <s-page heading="Products">
      <ProductsTable
        products={products}
        loading={false}
        onRowClick={handleRowClick}
        search={search}
        onSearchChange={setSearch}
      />
    </s-page>
  );
}
