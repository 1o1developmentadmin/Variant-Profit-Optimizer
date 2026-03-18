const WEIGHTS = [
  {
    key: "performance",
    label: "Performance",
    pct: 35,
    description:
      "Sales velocity, trend direction, and order volume over the scoring window",
  },
  {
    key: "profit",
    label: "Profit",
    pct: 35,
    description: "Gross margin percentage and revenue contribution per variant",
  },
  {
    key: "refundRisk",
    label: "Refund Risk",
    pct: 15,
    description:
      "Historical refund rate — high refund rates lower the overall score",
  },
  {
    key: "inventory",
    label: "Inventory",
    pct: 15,
    description:
      "Days of stock remaining relative to current sales velocity",
  },
];

export function ScoringWeightsDisplay() {
  return (
    <s-section heading="Scoring Weights">
      <s-banner tone="info">
        <s-paragraph>Customizable in a future update</s-paragraph>
      </s-banner>

      <s-stack direction="block" gap="base">
        {WEIGHTS.map((w) => (
          <s-stack key={w.key} direction="inline" gap="base" alignItems="center">
            <s-text>{w.label}</s-text>
            <s-badge tone="neutral">{w.pct}%</s-badge>
            <span title={w.description} style={{ cursor: "help", color: "var(--s-color-text-subdued)" }}>
              ⓘ
            </span>
          </s-stack>
        ))}
      </s-stack>
    </s-section>
  );
}
