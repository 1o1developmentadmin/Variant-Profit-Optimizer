import { useLoaderData, useNavigate } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import type { Route } from "./+types/app.products.$id";
import { getProductProfitability } from "../lib/metrics/profitability";
import { ProductHeader } from "../components/products/ProductHeader";
import { ProductInsights } from "../components/products/ProductInsights";
import { ProductVariantMatrix } from "../components/products/ProductVariantMatrix";

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const { session } = await authenticate.admin(request);
  const shopDomain = session.shop;
  const productId = params.id;

  const product = await db.product.findFirst({
    where: { shopDomain, id: productId },
    include: {
      variants: {
        select: {
          id: true,
          variantGid: true,
          title: true,
          sku: true,
          price: true,
          inventoryQuantity: true,
          productGid: true,
        },
      },
    },
  });

  if (!product) {
    throw new Response("Product not found", { status: 404 });
  }

  const windowDays = 30;
  let profitability = null;
  let costDataBanner: string | null = null;

  try {
    profitability = await getProductProfitability(shopDomain, product.productGid, windowDays);
    if (profitability.costCoveragePct < 100) {
      const missing = profitability.variantCount - profitability.variantsWithCostData;
      costDataBanner = `${missing} variant(s) are missing cost data. Gross profit may be understated.`;
    }
  } catch {
    costDataBanner = "Profitability data could not be loaded.";
  }

  // Build variant rows with stock health and profitability
  const variants = await Promise.all(
    product.variants.map(async (v: {
      id: string;
      variantGid: string;
      title: string;
      sku: string | null;
      price: number;
      inventoryQuantity: number | null;
      productGid: string;
    }) => {
      const variantProfit = profitability?.variantProfits?.find(
        (vp: { variantGid: string }) => vp.variantGid === v.variantGid,
      );

      const stock = v.inventoryQuantity ?? 0;
      let stockHealth = "unknown";
      if (stock <= 0) stockHealth = "out_of_stock";
      else if (stock <= 5) stockHealth = "critical";
      else if (stock <= 15) stockHealth = "low";
      else stockHealth = "healthy";

      return {
        variantGid: v.variantGid,
        title: v.title,
        sku: v.sku,
        price: v.price,
        revenue: variantProfit?.revenue ?? 0,
        grossProfit: variantProfit?.grossProfit ?? null,
        marginPct: variantProfit?.marginPct ?? null,
        hasCostData: variantProfit?.hasCostData ?? false,
        currentStock: stock,
        daysOfStockLeft: null,
        stockHealth,
      };
    }),
  );

  return {
    product: {
      id: product.id,
      title: product.title,
      productGid: product.productGid,
    },
    profitability: profitability
      ? {
          revenue: profitability.revenue,
          grossProfit: profitability.grossProfit,
          marginPct: profitability.marginPct,
          costCoveragePct: profitability.costCoveragePct,
          variantCount: profitability.variantCount,
        }
      : null,
    variants,
    costDataBanner,
    windowDays,
  };
};

export default function ProductDetail() {
  const { product, profitability, variants, costDataBanner } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  function handleVariantClick(variantGid: string) {
    navigate(`/app/variants/${encodeURIComponent(variantGid)}`);
  }

  type VariantItem = typeof variants[number];
  const insightVariants = variants.map((v: VariantItem) => ({
    variantGid: v.variantGid,
    title: v.title,
    hasCostData: v.hasCostData,
    grossProfit: v.grossProfit,
    stockHealth: v.stockHealth,
  }));

  return (
    <s-page heading={product.title}>
      <s-stack direction="block" gap="base">
        <s-button href="/app/products" variant="tertiary">
          ← Products
        </s-button>

        <ProductHeader
          title={product.title}
          variantCount={profitability?.variantCount ?? variants.length}
          revenue={profitability?.revenue ?? 0}
          grossProfit={profitability?.grossProfit ?? null}
          marginPct={profitability?.marginPct ?? null}
          costCoveragePct={profitability?.costCoveragePct ?? 0}
          costDataBanner={costDataBanner}
        />

        <ProductInsights variants={insightVariants} />

        <s-section heading="Variants">
          <ProductVariantMatrix
            variants={variants}
            onVariantClick={handleVariantClick}
          />
        </s-section>
      </s-stack>
    </s-page>
  );
}
