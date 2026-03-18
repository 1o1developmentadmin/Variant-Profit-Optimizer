import type { ReactNode } from "react";

type BannerTone = "info" | "success" | "warning" | "critical";

interface BannerMessageProps {
  tone?: BannerTone;
  title?: string;
  children: ReactNode;
  retryLabel?: string;
  onRetry?: () => void;
}

export function BannerMessage({
  tone = "info",
  title,
  children,
  retryLabel,
  onRetry,
}: BannerMessageProps) {
  return (
    <s-banner tone={tone} heading={title}>
      <s-paragraph>{children}</s-paragraph>
      {retryLabel && onRetry && (
        <s-button variant="secondary" onClick={onRetry}>
          {retryLabel}
        </s-button>
      )}
    </s-banner>
  );
}
