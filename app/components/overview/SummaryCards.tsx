interface Summary {
  push: number | null | undefined;
  deprioritize: number | null | undefined;
  lowMargin: number | null | undefined;
  refundRisk: number | null | undefined;
  stockRisk: number | null | undefined;
}

interface SummaryCardsProps {
  summary: Summary;
}

interface KpiCardProps {
  count: number | null | undefined;
  label: string;
  helperText: string;
  href: string;
}

function KpiCard({ count, label, helperText, href }: KpiCardProps) {
  return (
    <s-section>
      <s-stack direction="block" gap="small">
        <s-heading>{count != null ? String(count) : "—"}</s-heading>
        <s-text>{label}</s-text>
        <s-text tone="info">{helperText}</s-text>
        <s-button href={href} variant="tertiary">View</s-button>
      </s-stack>
    </s-section>
  );
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  return (
    <s-stack direction="inline" gap="base">
      <KpiCard
        count={summary.push}
        label="Push Now"
        helperText="Variants ready to promote"
        href="/app/recommendations?action=push"
      />
      <KpiCard
        count={summary.deprioritize}
        label="Deprioritize"
        helperText="Variants dragging performance"
        href="/app/recommendations?action=deprioritize"
      />
      <KpiCard
        count={summary.lowMargin}
        label="Low Margin"
        helperText="Variants with thin margins"
        href="/app/variants?quickFilter=low_margin"
      />
      <KpiCard
        count={summary.refundRisk}
        label="Refund Risk"
        helperText="High refund rate variants"
        href="/app/variants?quickFilter=high_refund_risk"
      />
      <KpiCard
        count={summary.stockRisk}
        label="Stock Risk"
        helperText="Low stock high-value variants"
        href="/app/variants?quickFilter=low_stock_high_value"
      />
    </s-stack>
  );
}
