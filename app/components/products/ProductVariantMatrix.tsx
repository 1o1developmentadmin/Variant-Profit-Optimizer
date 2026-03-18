import { NoCostDataBadge } from "../shared/NoCostDataBadge";

interface VariantRow {
  variantGid: string;
  title: string;
  sku: string | null;
  price: number;
  revenue: number;
  grossProfit: number | null;
  marginPct: number | null;
  hasCostData: boolean;
  currentStock: number | null;
  daysOfStockLeft: number | null;
  stockHealth: string;
}

interface ProductVariantMatrixProps {
  variants: VariantRow[];
  onVariantClick?: (variantGid: string) => void;
}

const STOCK_HEALTH_TONE: Record<string, string> = {
  healthy: "success",
  low: "warning",
  critical: "critical",
  out_of_stock: "critical",
  unknown: "neutral",
};

function fmt(n: number | null): string {
  if (n == null) return "—";
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function ProductVariantMatrix({ variants, onVariantClick }: ProductVariantMatrixProps) {
  if (!variants || variants.length === 0) {
    return <s-paragraph>No variants found.</s-paragraph>;
  }

  return (
    <s-table>
      <s-table-header-row>
        <s-table-header>Variant</s-table-header>
        <s-table-header>SKU</s-table-header>
        <s-table-header>Revenue</s-table-header>
        <s-table-header>Net Margin</s-table-header>
        <s-table-header>Stock Health</s-table-header>
        <s-table-header>Actions</s-table-header>
      </s-table-header-row>
      {variants.map((v) => {
        const stockTone = STOCK_HEALTH_TONE[v.stockHealth] ?? "neutral";
        return (
          <s-table-row key={v.variantGid}>
            <s-table-cell>{v.title}</s-table-cell>
            <s-table-cell>{v.sku ?? "—"}</s-table-cell>
            <s-table-cell>{fmt(v.revenue)}</s-table-cell>
            <s-table-cell>
              {v.hasCostData ? (
                v.marginPct != null ? `${v.marginPct.toFixed(1)}%` : "—"
              ) : (
                <s-stack direction="inline" gap="small">
                  <span>—</span>
                  <NoCostDataBadge />
                </s-stack>
              )}
            </s-table-cell>
            <s-table-cell>
              <s-badge tone={stockTone as any}>
                {v.stockHealth.replace(/_/g, " ")}
              </s-badge>
            </s-table-cell>
            <s-table-cell>
              <s-button
                variant="tertiary"
                onClick={() => onVariantClick?.(v.variantGid)}
              >
                View variant
              </s-button>
            </s-table-cell>
          </s-table-row>
        );
      })}
    </s-table>
  );
}
