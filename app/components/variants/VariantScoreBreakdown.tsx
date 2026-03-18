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
        <thead>
          <tr>
            <th>Score Type</th>
            <th>Score</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.type}>
              <td>{row.type}</td>
              <td>{row.score ?? row.notes}</td>
              <td>{row.score != null ? row.notes : ""}</td>
            </tr>
          ))}
        </tbody>
      </s-table>
    </s-section>
  );
}
