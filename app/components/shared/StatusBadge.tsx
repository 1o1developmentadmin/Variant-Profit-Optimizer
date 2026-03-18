interface StatusBadgeProps {
  action: string;
}

const ACTION_TONE: Record<string, string> = {
  push: "success",
  deprioritize: "warning",
  restock_soon: "caution",
  investigate_refunds: "critical",
  review_pricing: "info",
  no_action: "neutral",
  needs_more_data: "neutral",
};

const ACTION_LABEL: Record<string, string> = {
  push: "Push",
  deprioritize: "Deprioritize",
  restock_soon: "Restock Soon",
  investigate_refunds: "Investigate Refunds",
  review_pricing: "Review Pricing",
  no_action: "No Action",
  needs_more_data: "Needs More Data",
};

export function StatusBadge({ action }: StatusBadgeProps) {
  const tone = ACTION_TONE[action] ?? "neutral";
  const label = ACTION_LABEL[action] ?? action;
  return <s-badge tone={tone as any}>{label}</s-badge>;
}
