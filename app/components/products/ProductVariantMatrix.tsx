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
      <thead>
        <tr>
          <th>Variant</th>
          <th>SKU</th>
          <th>Revenue</th>
          <th>Net Margin</th>
          <th>Stock Health</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {variants.map((v) => {
          const stockTone = STOCK_HEALTH_TONE[v.stockHealth] ?? "neutral";
          return (
            <tr key={v.variantGid}>
              <td>{v.title}</td>
              <td>{v.sku ?? "—"}</td>
              <td>{fmt(v.revenue)}</td>
              <td>
                {v.hasCostData ? (
                  v.marginPct != null ? `${v.marginPct.toFixed(1)}%` : "—"
                ) : (
                  <s-stack direction="inline" gap="small">
                    <span>—</span>
                    <NoCostDataBadge />
                  </s-stack>
                )}
              </td>
              <td>
                <s-badge tone={stockTone as any}>
                  {v.stockHealth.replace(/_/g, " ")}
                </s-badge>
              </td>
              <td>
                <s-button
                  variant="tertiary"
                  onClick={() => onVariantClick?.(v.variantGid)}
                >
                  View variant
                </s-button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </s-table>
  );
}
