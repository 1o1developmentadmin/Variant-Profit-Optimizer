interface ProductHeaderProps {
  title: string;
  variantCount: number;
  revenue: number;
  grossProfit: number | null;
  marginPct: number | null;
  costCoveragePct: number;
  costDataBanner?: string | null;
}

function fmt(n: number | null): string {
  if (n == null) return "—";
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function ProductHeader({
  title,
  variantCount,
  revenue,
  grossProfit,
  marginPct,
  costCoveragePct,
  costDataBanner,
}: ProductHeaderProps) {
  return (
    <s-stack direction="block" gap="base">
      {costDataBanner && (
        <s-banner tone="warning">{costDataBanner}</s-banner>
      )}
      <s-heading>{title}</s-heading>
      <s-stack direction="inline" gap="base">
        <s-badge tone="neutral">{variantCount} variants</s-badge>
        <s-badge tone="neutral">Revenue: {fmt(revenue)}</s-badge>
        <s-badge tone="neutral">
          Gross Profit: {grossProfit != null ? fmt(grossProfit) : "—"}
        </s-badge>
        {marginPct != null && (
          <s-badge tone="neutral">Margin: {marginPct.toFixed(1)}%</s-badge>
        )}
        <s-badge tone="neutral">Cost Coverage: {costCoveragePct.toFixed(0)}%</s-badge>
      </s-stack>
    </s-stack>
  );
}
