interface VariantScoreBreakdownProps {
  performanceScore: number | null;
  profitScore: number | null;
  refundScore: number | null;
  inventoryScore: number | null;
  opportunityScore: number | null;
  riskScore: number | null;
  confidenceScore: number | null;
  hasCostData: boolean;
}

function fmtScore(n: number | null): string {
  if (n == null) return "—";
  return String(Math.round(n));
}

export function VariantScoreBreakdown({
  performanceScore,
  profitScore,
  refundScore,
  inventoryScore,
  opportunityScore,
  riskScore,
  confidenceScore,
  hasCostData,
}: VariantScoreBreakdownProps) {
  const rows = [
    {
      type: "Conversion / Performance",
      score: fmtScore(performanceScore),
      notes: "Based on sales velocity and order frequency",
    },
    {
      type: "Profit",
      score: !hasCostData ? null : fmtScore(profitScore),
      notes: !hasCostData ? "Unavailable — cost data missing" : "Based on gross margin",
    },
    {
      type: "Refund",
      score: fmtScore(refundScore),
      notes: "Based on refund rate vs. average",
    },
    {
      type: "Inventory",
      score: fmtScore(inventoryScore),
      notes: "Based on stock levels and velocity",
    },
    {
      type: "Opportunity",
      score: fmtScore(opportunityScore),
      notes: "Overall upside potential",
    },
    {
      type: "Risk",
      score: fmtScore(riskScore),
      notes: "Overall downside risk",
    },
    {
      type: "Confidence",
      score: confidenceScore != null ? `${Math.round(confidenceScore)}%` : "—",
      notes: "Data completeness and reliability",
    },
  ];

  return (
    <s-section heading="Score Breakdown">
      <s-table>
        <s-table-header-row>
          <s-table-header>Score Type</s-table-header>
          <s-table-header>Score</s-table-header>
          <s-table-header>Notes</s-table-header>
        </s-table-header-row>
        {rows.map((row) => (
          <s-table-row key={row.type}>
            <s-table-cell>{row.type}</s-table-cell>
            <s-table-cell>{row.score ?? row.notes}</s-table-cell>
            <s-table-cell>{row.score != null ? row.notes : ""}</s-table-cell>
          </s-table-row>
        ))}
      </s-table>
    </s-section>
  );
}
