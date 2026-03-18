import { SingleVariantBadge } from "../shared/SingleVariantBadge";

interface VariantActionPanelProps {
  type: string | null;
  titleText: string | null;
  bodyText: string | null;
  isSingleVariantProduct: boolean;
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

export function VariantActionPanel({
  type,
  titleText,
  bodyText,
  isSingleVariantProduct,
}: VariantActionPanelProps) {
  const steps = type ? SUGGESTED_STEPS[type] ?? [] : [];
  const hasContent = type || bodyText;

  if (!hasContent) {
    return (
      <s-section heading="Recommended Action">
        <s-paragraph>
          No recommendation available yet. Sync more data to generate insights.
        </s-paragraph>
      </s-section>
    );
  }

  return (
    <s-section heading="Recommended Action">
      <s-stack direction="block" gap="base">
        {isSingleVariantProduct && (
          <div>
            <SingleVariantBadge />
          </div>
        )}

        {bodyText && (
          <s-section heading="Why this matters">
            <s-paragraph>{bodyText}</s-paragraph>
          </s-section>
        )}

        {steps.length > 0 && (
          <s-section heading="Suggested actions">
            <s-stack direction="block" gap="small">
              {steps.map((step, idx) => (
                <s-paragraph key={idx}>{step}</s-paragraph>
              ))}
            </s-stack>
          </s-section>
        )}
      </s-stack>
    </s-section>
  );
}
