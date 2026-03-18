import React from "react";

interface MetricTooltipProps {
  metric: string;
  definition: string;
  children: React.ReactNode;
}

export function MetricTooltip({ metric, definition, children }: MetricTooltipProps) {
  return (
    <span title={`${metric}: ${definition}`}>
      {children}
    </span>
  );
}
