import { NoCostDataBadge } from "../shared/NoCostDataBadge";

interface ProductRow {
  id: string;
  title: string;
  variantCount: number;
  revenue: number;
  grossProfit: number | null;
  marginPct: number | null;
  missingCostVariants: number;
}

interface OpportunityProductsTableProps {
  products: ProductRow[];
}

function fmt(n: number | null): string {
  if (n == null) return "—";
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function OpportunityProductsTable({ products }: OpportunityProductsTableProps) {
  if (!products || products.length === 0) {
    return (
      <s-section heading="Opportunity Products">
        <s-paragraph>No products to show.</s-paragraph>
      </s-section>
    );
  }

  return (
    <s-section heading="Opportunity Products">
      <s-table>
        <thead>
          <tr>
            <th>Product</th>
            <th>Variants</th>
            <th>Revenue</th>
            <th>Gross Profit (excl. fees &amp; shipping)</th>
            <th>Issues</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id} style={{ cursor: "pointer" }}>
              <td>{product.title}</td>
              <td>{product.variantCount}</td>
              <td>{fmt(product.revenue)}</td>
              <td>{product.grossProfit != null ? fmt(product.grossProfit) : "—"}</td>
              <td>
                {product.missingCostVariants > 0 && <NoCostDataBadge />}
              </td>
              <td>
                <s-button href={`/app/products/${product.id}`} variant="tertiary">
                  View
                </s-button>
              </td>
            </tr>
          ))}
        </tbody>
      </s-table>
    </s-section>
  );
}
