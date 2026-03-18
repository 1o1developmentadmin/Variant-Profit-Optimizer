import { NoCostDataBadge } from "../shared/NoCostDataBadge";
import { StatusBadge } from "../shared/StatusBadge";
import { SingleVariantBadge } from "../shared/SingleVariantBadge";

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

interface VariantsTableProps {
  variants: VariantRow[];
  loading: boolean;
  onRowClick: (variant: VariantRow) => void;
  quickFilter: string;
  onQuickFilterChange: (val: string) => void;
}

const QUICK_FILTERS = [
  { key: "", label: "All" },
  { key: "push", label: "Push Now" },
  { key: "low_margin", label: "Low Margin" },
  { key: "high_refund_risk", label: "High Refund Risk" },
  { key: "low_stock_high_value", label: "Low Stock High Value" },
  { key: "negative_profit", label: "Negative Profit" },
];

function fmt(n: number | null): string {
  if (n == null) return "—";
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function VariantsTable({
  variants,
  loading,
  onRowClick,
  quickFilter,
  onQuickFilterChange,
}: VariantsTableProps) {
  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>
        <s-spinner size="base" />
      </div>
    );
  }

  return (
    <s-stack direction="block" gap="base">
      <s-stack direction="inline" gap="small">
        {QUICK_FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => onQuickFilterChange(f.key)}
            style={{
              padding: "4px 12px",
              borderRadius: "16px",
              border: "1px solid #ccc",
              background: quickFilter === f.key ? "#000" : "#fff",
              color: quickFilter === f.key ? "#fff" : "#000",
              cursor: "pointer",
              fontSize: "13px",
            }}
          >
            {f.label}
          </button>
        ))}
      </s-stack>

      {variants.length === 0 ? (
        <s-paragraph>No variants match the selected filter.</s-paragraph>
      ) : (
        <s-table>
          <thead>
            <tr>
              <th>Variant</th>
              <th>SKU</th>
              <th>Revenue</th>
              <th>Gross Profit (excl. fees &amp; shipping)</th>
              <th>Margin %</th>
              <th>Stock</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {variants.map((v) => (
              <tr
                key={v.id}
                onClick={() => onRowClick(v)}
                style={{ cursor: "pointer" }}
              >
                <td>{v.title}</td>
                <td>{v.sku ?? "—"}</td>
                <td>{fmt(v.revenue)}</td>
                <td>
                  {v.hasCostData ? fmt(v.grossProfit) : <NoCostDataBadge />}
                </td>
                <td>
                  {v.marginPct != null ? `${v.marginPct.toFixed(1)}%` : "—"}
                </td>
                <td>{v.inventoryQuantity ?? "—"}</td>
                <td>
                  {v.recommendedAction ? (
                    <StatusBadge action={v.recommendedAction} />
                  ) : v.isSingleVariantProduct ? (
                    <SingleVariantBadge />
                  ) : (
                    "—"
                  )}
                  <s-button
                    variant="tertiary"
                    onClick={() => onRowClick(v)}
                  >
                    View
                  </s-button>
                </td>
              </tr>
            ))}
          </tbody>
        </s-table>
      )}
    </s-stack>
  );
}
