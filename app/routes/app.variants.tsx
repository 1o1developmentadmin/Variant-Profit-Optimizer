import { useState } from "react";
import { useLoaderData, useNavigate } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import type { Route } from "./+types/app.variants";
import { getVariantProfitability } from "../lib/metrics/profitability";
import { VariantsTable } from "../components/variants/VariantsTable";

export const loader = async ({ request }: Route.LoaderArgs) => {
  const { session } = await authenticate.admin(request);
  const shopDomain = session.shop;

  const url = new URL(request.url);
  const quickFilter = url.searchParams.get("quickFilter") ?? "";
  const windowDays = parseInt(url.searchParams.get("window") ?? "30", 10);

  const rawVariants = await db.variant.findMany({
    where: { shopDomain },
    take: 100,
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

  const variants = await Promise.all(
    rawVariants.map(async (v: {
      id: string;
      variantGid: string;
      productGid: string;
      title: string;
      sku: string | null;
      price: number;
      inventoryQuantity: number | null;
    }) => {
      let revenue = 0;
      let grossProfit: number | null = null;
      let marginPct: number | null = null;
      let hasCostData = false;

      try {
        const profit = await getVariantProfitability(shopDomain, v.variantGid, windowDays);
        revenue = profit.revenue;
        grossProfit = profit.grossProfit;
        marginPct = profit.marginPct;
        hasCostData = profit.hasCostData;
      } catch {
        // leave defaults
      }

      // Load score for action
      const score = await db.variantScore.findUnique({
        where: { shopDomain_variantGid: { shopDomain, variantGid: v.variantGid } },
        select: { recommendedAction: true, isSingleVariantProduct: true },
      });

      return {
        id: v.id,
        variantGid: v.variantGid,
        productGid: v.productGid,
        title: v.title,
        sku: v.sku,
        price: v.price,
        revenue,
        grossProfit,
        marginPct,
        hasCostData,
        inventoryQuantity: v.inventoryQuantity,
        recommendedAction: score?.recommendedAction ?? null,
        isSingleVariantProduct: score?.isSingleVariantProduct ?? false,
      };
    }),
  );

  return { variants, quickFilter, windowDays };
};

interface VariantRow {
  id: string;
  variantGid: string;
  productGid: string | null;
  title: string;
  sku: string | null;
  price: number;
  revenue: number;
  grossProfit: number | null;
  marginPct: number | null;
  hasCostData: boolean;
  inventoryQuantity: number | null;
  recommendedAction?: string | null;
  isSingleVariantProduct?: boolean;
}

export default function Variants() {
  const { variants, quickFilter: initialFilter } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [quickFilter, setQuickFilter] = useState(initialFilter ?? "");

  function handleQuickFilterChange(val: string) {
    setQuickFilter(val);
    const params = new URLSearchParams();
    if (val) params.set("quickFilter", val);
    navigate(`/app/variants?${params.toString()}`);
  }

  function handleRowClick(variant: VariantRow) {
    navigate(`/app/variants/${encodeURIComponent(variant.variantGid)}`);
  }

  // Client-side quick filter
  const filteredVariants = (variants as VariantRow[]).filter((v) => {
    if (!quickFilter) return true;
    if (quickFilter === "push") return v.recommendedAction === "push";
    if (quickFilter === "low_margin") return v.marginPct != null && v.marginPct < 15;
    if (quickFilter === "high_refund_risk") return false; // Would need refund score
    if (quickFilter === "low_stock_high_value")
      return (v.inventoryQuantity ?? 0) < 10 && v.revenue > 100;
    if (quickFilter === "negative_profit") return v.grossProfit != null && v.grossProfit < 0;
    return true;
  });

  return (
    <s-page heading="Variants">
      <VariantsTable
        variants={filteredVariants}
        loading={false}
        onRowClick={handleRowClick}
        quickFilter={quickFilter}
        onQuickFilterChange={handleQuickFilterChange}
      />
    </s-page>
  );
}
