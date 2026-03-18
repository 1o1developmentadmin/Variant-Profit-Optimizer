import { StatusBadge } from "../shared/StatusBadge";
import { RecommendationReasonChips } from "./RecommendationReasonChips";

interface Rec {
  id: string;
  variantGid: string;
  variantTitle: string | null;
  productGid: string | null;
  productTitle: string | null;
  type: string | null;
  confidenceScore: number | null;
  priority: number;
  titleText: string | null;
  bodyText: string | null;
  status: string;
}

interface RecommendationTableProps {
  recommendations: Rec[];
  loading: boolean;
  onRowClick: (rec: Rec) => void;
  actionFilter: string;
  onActionFilterChange: (val: string) => void;
  search: string;
  onSearchChange: (val: string) => void;
}

const ACTION_OPTIONS = [
  { value: "", label: "All" },
  { value: "push", label: "Push" },
  { value: "deprioritize", label: "Deprioritize" },
  { value: "restock_soon", label: "Restock Soon" },
  { value: "investigate_refunds", label: "Investigate Refunds" },
  { value: "review_pricing", label: "Review Pricing" },
  { value: "no_action", label: "No Action" },
];

function confidenceTone(score: number | null): string {
  if (score == null) return "neutral";
  if (score >= 75) return "success";
  if (score >= 55) return "caution";
  return "warning";
}

export function RecommendationTable({
  recommendations,
  loading,
  onRowClick,
  actionFilter,
  onActionFilterChange,
  search,
  onSearchChange,
}: RecommendationTableProps) {
  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>
        <s-spinner size="base" />
      </div>
    );
  }

  return (
    <s-stack direction="block" gap="base">
      <s-stack direction="inline" gap="base">
        <select
          value={actionFilter}
          onChange={(e) => onActionFilterChange(e.target.value)}
          style={{
            padding: "6px 12px",
            borderRadius: "4px",
            border: "1px solid #ccc",
            fontSize: "14px",
          }}
        >
          {ACTION_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by product or variant..."
          style={{
            padding: "6px 12px",
            borderRadius: "4px",
            border: "1px solid #ccc",
            fontSize: "14px",
            minWidth: "250px",
          }}
        />
      </s-stack>

      {recommendations.length === 0 ? (
        <s-paragraph>No recommendations match your filters.</s-paragraph>
      ) : (
        <s-table>
          <s-table-header-row>
            <s-table-header>Product</s-table-header>
            <s-table-header>Variant</s-table-header>
            <s-table-header>Action</s-table-header>
            <s-table-header>Confidence</s-table-header>
            <s-table-header>Reason Summary</s-table-header>
            <s-table-header>CTA</s-table-header>
          </s-table-header-row>
          {recommendations.map((rec) => (
            <s-table-row key={rec.id}>
              <s-table-cell>{rec.productTitle ?? "—"}</s-table-cell>
              <s-table-cell>{rec.variantTitle ?? "—"}</s-table-cell>
              <s-table-cell>
                {rec.type ? <StatusBadge action={rec.type} /> : "—"}
              </s-table-cell>
              <s-table-cell>
                {rec.confidenceScore != null ? (
                  <s-badge tone={confidenceTone(rec.confidenceScore) as any}>
                    {Math.round(rec.confidenceScore)}%
                  </s-badge>
                ) : (
                  "—"
                )}
              </s-table-cell>
              <s-table-cell>
                {rec.titleText ? (
                  <RecommendationReasonChips reasons={[rec.titleText]} />
                ) : (
                  "—"
                )}
              </s-table-cell>
              <s-table-cell>
                <s-button variant="tertiary" onClick={() => onRowClick(rec)}>
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
