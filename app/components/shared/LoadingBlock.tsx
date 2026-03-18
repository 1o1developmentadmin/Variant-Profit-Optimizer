interface LoadingBlockProps {
  label?: string;
}

export function LoadingBlock({ label }: LoadingBlockProps) {
  return (
    <s-stack direction="inline" gap="small" alignItems="center">
      <s-spinner size="base" />
      {label && <s-text>{label}</s-text>}
    </s-stack>
  );
}
