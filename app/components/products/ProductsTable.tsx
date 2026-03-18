import { NoCostDataBadge } from "../shared/NoCostDataBadge";

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

interface ProductsTableProps {
  products: ProductRow[];
  loading: boolean;
  onRowClick: (product: ProductRow) => void;
  search: string;
  onSearchChange: (val: string) => void;
}

function fmt(n: number | null): string {
  if (n == null) return "—";
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtPct(n: number | null): string {
  if (n == null) return "—";
  return `${n.toFixed(1)}%`;
}

export function ProductsTable({
  products,
  loading,
  onRowClick,
  search,
  onSearchChange,
}: ProductsTableProps) {
  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>
        <s-spinner size="base" />
      </div>
    );
  }

  const filtered = search
    ? products.filter((p) => p.title.toLowerCase().includes(search.toLowerCase()))
    : products;

  return (
    <s-stack direction="block" gap="base">
      <input
        type="text"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search products..."
        style={{
          padding: "6px 12px",
          borderRadius: "4px",
          border: "1px solid #ccc",
          fontSize: "14px",
          minWidth: "250px",
        }}
      />

      {filtered.length === 0 ? (
        <s-paragraph>No products found.</s-paragraph>
      ) : (
        <s-table>
          <s-table-header-row>
            <s-table-header>Product</s-table-header>
            <s-table-header>Variants</s-table-header>
            <s-table-header>Revenue</s-table-header>
            <s-table-header>Gross Profit (excl. fees &amp; shipping)</s-table-header>
            <s-table-header>Margin %</s-table-header>
            <s-table-header>Issues</s-table-header>
            <s-table-header>Actions</s-table-header>
          </s-table-header-row>
          {filtered.map((product) => (
            <s-table-row key={product.id}>
              <s-table-cell>{product.title}</s-table-cell>
              <s-table-cell>{product.variantCount}</s-table-cell>
              <s-table-cell>{fmt(product.revenue)}</s-table-cell>
              <s-table-cell>{fmt(product.grossProfit)}</s-table-cell>
              <s-table-cell>{fmtPct(product.marginPct)}</s-table-cell>
              <s-table-cell>
                {product.missingCostVariants > 0 && <NoCostDataBadge />}
              </s-table-cell>
              <s-table-cell>
                <s-button
                  variant="tertiary"
                  onClick={() => onRowClick(product)}
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
