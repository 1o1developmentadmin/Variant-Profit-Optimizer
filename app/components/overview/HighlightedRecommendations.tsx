import { StatusBadge } from "../shared/StatusBadge";

interface Recommendation {
  id: string;
  variantTitle: string | null;
  productTitle: string | null;
  type: string | null;
  confidenceScore: number | null;
  titleText: string | null;
  bodyText: string | null;
  variantGid: string;
}

interface HighlightedRecommendationsProps {
  recommendations: Recommendation[];
}

export function HighlightedRecommendations({ recommendations }: HighlightedRecommendationsProps) {
  if (!recommendations || recommendations.length === 0) {
    return (
      <s-section heading="Top Recommendations">
        <s-paragraph>No urgent variant actions right now.</s-paragraph>
      </s-section>
    );
  }

  return (
    <s-section heading="Top Recommendations">
      <s-stack direction="block" gap="base">
        {recommendations.slice(0, 5).map((rec) => (
          <s-section key={rec.id}>
            <s-stack direction="block" gap="small">
              <s-stack direction="inline" gap="small">
                {rec.type && <StatusBadge action={rec.type} />}
                <s-text>
                  {rec.productTitle ?? "Unknown Product"} — {rec.variantTitle ?? "Unknown Variant"}
                </s-text>
              </s-stack>
              {rec.titleText && (
                <span>
                  <s-badge tone="neutral">{rec.titleText}</s-badge>
                </span>
              )}
              {rec.bodyText && <s-paragraph>{rec.bodyText}</s-paragraph>}
              <s-button
                href={`/app/variants/${encodeURIComponent(rec.variantGid)}`}
                variant="tertiary"
              >
                View details
              </s-button>
            </s-stack>
          </s-section>
        ))}
      </s-stack>
    </s-section>
  );
}
