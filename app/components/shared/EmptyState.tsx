interface EmptyStateProps {
  heading: string;
  description: string;
  ctaLabel?: string;
  ctaHref?: string;
  onCtaClick?: () => void;
}

export function EmptyState({
  heading,
  description,
  ctaLabel,
  ctaHref,
  onCtaClick,
}: EmptyStateProps) {
  return (
    <s-section heading={heading}>
      <s-paragraph>{description}</s-paragraph>
      {ctaLabel && (
        <s-stack direction="inline" gap="base">
          {ctaHref ? (
            <s-button href={ctaHref} variant="primary">
              {ctaLabel}
            </s-button>
          ) : (
            <s-button variant="primary" onClick={onCtaClick}>
              {ctaLabel}
            </s-button>
          )}
        </s-stack>
      )}
    </s-section>
  );
}
