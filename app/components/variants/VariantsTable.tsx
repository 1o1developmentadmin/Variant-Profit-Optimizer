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
          <s-table-header-row>
            <s-table-header>Variant</s-table-header>
            <s-table-header>SKU</s-table-header>
            <s-table-header>Revenue</s-table-header>
            <s-table-header>Gross Profit (excl. fees &amp; shipping)</s-table-header>
            <s-table-header>Margin %</s-table-header>
            <s-table-header>Stock</s-table-header>
            <s-table-header>Actions</s-table-header>
          </s-table-header-row>
          {variants.map((v) => (
            <s-table-row key={v.id}>
              <s-table-cell>{v.title}</s-table-cell>
              <s-table-cell>{v.sku ?? "—"}</s-table-cell>
              <s-table-cell>{fmt(v.revenue)}</s-table-cell>
              <s-table-cell>
                {v.hasCostData ? fmt(v.grossProfit) : <NoCostDataBadge />}
              </s-table-cell>
              <s-table-cell>
                {v.marginPct != null ? `${v.marginPct.toFixed(1)}%` : "—"}
              </s-table-cell>
              <s-table-cell>{v.inventoryQuantity ?? "—"}</s-table-cell>
              <s-table-cell>
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
              </s-table-cell>
            </s-table-row>
          ))}
        </s-table>
      )}
    </s-stack>
  );
}
