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
        <s-table-header-row>
          <s-table-header>Product</s-table-header>
          <s-table-header>Variants</s-table-header>
          <s-table-header>Revenue</s-table-header>
          <s-table-header>Gross Profit (excl. fees &amp; shipping)</s-table-header>
          <s-table-header>Issues</s-table-header>
          <s-table-header>Actions</s-table-header>
        </s-table-header-row>
        {products.map((product) => (
          <s-table-row key={product.id}>
            <s-table-cell>{product.title}</s-table-cell>
            <s-table-cell>{product.variantCount}</s-table-cell>
            <s-table-cell>{fmt(product.revenue)}</s-table-cell>
            <s-table-cell>{product.grossProfit != null ? fmt(product.grossProfit) : "—"}</s-table-cell>
            <s-table-cell>
              {product.missingCostVariants > 0 && <NoCostDataBadge />}
            </s-table-cell>
            <s-table-cell>
              <s-button href={`/app/products/${product.id}`} variant="tertiary">
                View
              </s-button>
            </s-table-cell>
          </s-table-row>
        ))}
      </s-table>
    </s-section>
  );
}
