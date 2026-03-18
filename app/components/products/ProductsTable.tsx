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
          <thead>
            <tr>
              <th>Product</th>
              <th>Variants</th>
              <th>Revenue</th>
              <th>Gross Profit (excl. fees &amp; shipping)</th>
              <th>Margin %</th>
              <th>Issues</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((product) => (
              <tr
                key={product.id}
                onClick={() => onRowClick(product)}
                style={{ cursor: "pointer" }}
              >
                <td>{product.title}</td>
                <td>{product.variantCount}</td>
                <td>{fmt(product.revenue)}</td>
                <td>{fmt(product.grossProfit)}</td>
                <td>{fmtPct(product.marginPct)}</td>
                <td>
                  {product.missingCostVariants > 0 && <NoCostDataBadge />}
                </td>
                <td>
                  <s-button
                    variant="tertiary"
                    onClick={() => onRowClick(product)}
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
