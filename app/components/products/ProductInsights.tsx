interface VariantInsight {
  variantGid: string;
  title: string;
  hasCostData: boolean;
  grossProfit: number | null;
  stockHealth: string;
}

interface ProductInsightsProps {
  variants: VariantInsight[];
}

export function ProductInsights({ variants }: ProductInsightsProps) {
  if (!variants || variants.length === 0) return null;

  const withCost = variants.filter((v) => v.hasCostData && v.grossProfit != null);
  const bestVariant =
    withCost.length > 0
      ? withCost.reduce((best, v) =>
          (v.grossProfit ?? -Infinity) > (best.grossProfit ?? -Infinity) ? v : best,
        )
      : null;

  const stockAlert = variants.find(
    (v) => v.stockHealth === "critical" || v.stockHealth === "out_of_stock",
  );

  const worstVariant =
    withCost.length > 0
      ? withCost.reduce((worst, v) =>
          (v.grossProfit ?? Infinity) < (worst.grossProfit ?? Infinity) ? v : worst,
        )
      : null;
  const hasNegativeMargin = worstVariant && (worstVariant.grossProfit ?? 0) < 0;

  const hasInsights = bestVariant || stockAlert || hasNegativeMargin;
  if (!hasInsights) return null;

  return (
    <s-section heading="Insights">
      <s-stack direction="block" gap="small">
        {bestVariant && (
          <s-stack direction="inline" gap="small">
            <s-badge tone="success">Top Performer</s-badge>
            <s-text>Strongest performer: {bestVariant.title}</s-text>
          </s-stack>
        )}
        {stockAlert && (
          <s-stack direction="inline" gap="small">
            <s-badge tone="warning">Stock Alert</s-badge>
            <s-text>{stockAlert.title} needs stock attention</s-text>
          </s-stack>
        )}
        {hasNegativeMargin && worstVariant && (
          <s-stack direction="inline" gap="small">
            <s-badge tone="caution">Margin Risk</s-badge>
            <s-text>{worstVariant.title} may be losing margin</s-text>
          </s-stack>
        )}
      </s-stack>
    </s-section>
  );
}
