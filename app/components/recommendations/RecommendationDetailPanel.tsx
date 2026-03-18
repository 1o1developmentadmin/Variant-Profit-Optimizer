import { StatusBadge } from "../shared/StatusBadge";
import { NoCostDataBadge } from "../shared/NoCostDataBadge";
import { SingleVariantBadge } from "../shared/SingleVariantBadge";

interface Rec {
  id: string;
  variantGid: string;
  variantTitle: string | null;
  productTitle: string | null;
  type: string | null;
  confidenceScore: number | null;
  titleText: string | null;
  bodyText: string | null;
}

interface RecommendationDetailPanelProps {
  rec: Rec | null;
  onClose: () => void;
}

const SUGGESTED_STEPS: Record<string, string[]> = {
  push: [
    "Set as default variant in Shopify",
    "Feature in merchandising",
  ],
  deprioritize: [
    "Do not push in paid traffic",
    "Remove from featured collections",
  ],
  restock_soon: [
    "Restock within 7 days",
    "Review supplier lead times",
  ],
  investigate_refunds: [
    "Review return reasons",
    "Check product quality",
  ],
  review_pricing: [
    "Compare to competitor pricing",
    "Review margin targets",
  ],
};

export function RecommendationDetailPanel({ rec, onClose }: RecommendationDetailPanelProps) {
  if (!rec) return null;

  const steps = rec.type ? SUGGESTED_STEPS[rec.type] ?? [] : [];
  const showNoCostData = rec.type === "review_pricing" || rec.type === "investigate_refunds";
  const showSingleVariant = rec.type === "no_action" || rec.type === "needs_more_data";

  return (
    <s-section>
      <s-stack direction="block" gap="base">
        <s-stack direction="inline" justifyContent="space-between">
          <s-heading>Recommendation Details</s-heading>
          <s-button variant="tertiary" onClick={onClose}>
            Close
          </s-button>
        </s-stack>

        <s-section heading="What we recommend">
          <s-stack direction="inline" gap="small">
            {rec.type && <StatusBadge action={rec.type} />}
            <s-text>{rec.variantTitle ?? "Unknown Variant"}</s-text>
          </s-stack>
        </s-section>

        {rec.bodyText && (
          <s-section heading="Why we recommend it">
            <s-paragraph>{rec.bodyText}</s-paragraph>
          </s-section>
        )}

        <s-section heading="What data supports it">
          <s-text>
            Confidence score:{" "}
            {rec.confidenceScore != null
              ? `${Math.round(rec.confidenceScore)}%`
              : "—"}
          </s-text>
        </s-section>

        {steps.length > 0 && (
          <s-section heading="Suggested next steps">
            <s-stack direction="block" gap="small">
              {steps.map((step, idx) => (
                <s-paragraph key={idx}>{step}</s-paragraph>
              ))}
            </s-stack>
          </s-section>
        )}

        {(showNoCostData || showSingleVariant) && (
          <s-stack direction="inline" gap="small">
            {showNoCostData && <NoCostDataBadge />}
            {showSingleVariant && <SingleVariantBadge />}
          </s-stack>
        )}
      </s-stack>
    </s-section>
  );
}
