import { useState } from "react";
import { useLoaderData, useNavigate } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import type { Route } from "./+types/app.recommendations";
import { RecommendationTable } from "../components/recommendations/RecommendationTable";
import { RecommendationDetailPanel } from "../components/recommendations/RecommendationDetailPanel";

export const loader = async ({ request }: Route.LoaderArgs) => {
  const { session } = await authenticate.admin(request);
  const shopDomain = session.shop;

  const url = new URL(request.url);
  const actionParam = url.searchParams.get("action") ?? "";
  const minConfidence = parseFloat(url.searchParams.get("minConfidence") ?? "0");
  const search = url.searchParams.get("search") ?? "";
  const page = parseInt(url.searchParams.get("page") ?? "1", 10);
  const pageSize = parseInt(url.searchParams.get("pageSize") ?? "20", 10);

  const where: Record<string, unknown> = { shopDomain, status: "active" };
  if (actionParam) where.type = actionParam;
  if (minConfidence > 0) {
    where.confidenceScore = { gte: minConfidence };
  }

  const allRecs = await db.recommendation.findMany({
    where,
    orderBy: { priority: "desc" },
    select: {
      id: true,
      variantGid: true,
      variantTitle: true,
      productGid: true,
      type: true,
      confidenceScore: true,
      priority: true,
      titleText: true,
      bodyText: true,
      status: true,
    },
  });

  // Enrich with product titles
  const productGids = [...new Set(allRecs.map((r: { productGid: string | null }) => r.productGid).filter(Boolean))] as string[];
  const products = productGids.length > 0
    ? await db.product.findMany({
        where: { shopDomain, productGid: { in: productGids } },
        select: { productGid: true, title: true },
      })
    : [];
  const productTitleMap: Record<string, string> = {};
  for (const p of products) {
    productTitleMap[p.productGid] = p.title;
  }

  const enriched = allRecs.map((r: {
    id: string;
    variantGid: string;
    variantTitle: string | null;
    productGid: string | null;
    type: string | null;
    confidenceScore: number | null;
    priority: number;
    titleText: string | null;
    bodyText: string | null;
    status: string;
  }) => ({
    ...r,
    productTitle: r.productGid ? productTitleMap[r.productGid] ?? null : null,
  }));

  // Client-side search filter
  const filtered = search
    ? enriched.filter((r: { variantTitle: string | null; productTitle: string | null }) => {
        const q = search.toLowerCase();
        return (
          (r.variantTitle ?? "").toLowerCase().includes(q) ||
          (r.productTitle ?? "").toLowerCase().includes(q)
        );
      })
    : enriched;

  const total = filtered.length;
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  return {
    recommendations: paginated,
    filters: { action: actionParam, search },
    total,
    page,
    pageSize,
  };
};

interface RecItem {
  id: string;
  variantGid: string;
  variantTitle: string | null;
  productGid: string | null;
  productTitle: string | null;
  type: string | null;
  confidenceScore: number | null;
  priority: number;
  titleText: string | null;
  bodyText: string | null;
  status: string;
}

export default function Recommendations() {
  const { recommendations, filters } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  const [selectedRec, setSelectedRec] = useState<RecItem | null>(null);
  const [actionFilter, setActionFilter] = useState(filters.action ?? "");
  const [search, setSearch] = useState(filters.search ?? "");

  function handleActionFilterChange(val: string) {
    setActionFilter(val);
    const params = new URLSearchParams();
    if (val) params.set("action", val);
    if (search) params.set("search", search);
    navigate(`/app/recommendations?${params.toString()}`);
  }

  function handleSearchChange(val: string) {
    setSearch(val);
    const params = new URLSearchParams();
    if (actionFilter) params.set("action", actionFilter);
    if (val) params.set("search", val);
    navigate(`/app/recommendations?${params.toString()}`);
  }

  return (
    <s-page heading="Recommendations">
      <s-stack direction="block" gap="base">
        <RecommendationTable
          recommendations={recommendations as RecItem[]}
          loading={false}
          onRowClick={(rec) => setSelectedRec(rec)}
          actionFilter={actionFilter}
          onActionFilterChange={handleActionFilterChange}
          search={search}
          onSearchChange={handleSearchChange}
        />

        {selectedRec && (
          <RecommendationDetailPanel
            rec={selectedRec}
            onClose={() => setSelectedRec(null)}
          />
        )}
      </s-stack>
    </s-page>
  );
}
