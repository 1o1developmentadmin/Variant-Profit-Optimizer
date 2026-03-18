interface RecommendationReasonChipsProps {
  reasons: string[];
}

export function RecommendationReasonChips({ reasons }: RecommendationReasonChipsProps) {
  if (!reasons || reasons.length === 0) return null;

  return (
    <s-stack direction="inline" gap="small">
      {reasons.map((reason, idx) => (
        <s-badge key={idx} tone="neutral">
          {reason}
        </s-badge>
      ))}
    </s-stack>
  );
}
