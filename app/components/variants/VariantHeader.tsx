import { StatusBadge } from "../shared/StatusBadge";
import { SingleVariantBadge } from "../shared/SingleVariantBadge";

interface VariantHeaderProps {
  productTitle: string;
  variantTitle: string;
  recommendedAction: string | null;
  confidenceScore: number | null;
  isSingleVariantProduct: boolean;
}

export function VariantHeader({
  productTitle,
  variantTitle,
  recommendedAction,
  confidenceScore,
  isSingleVariantProduct,
}: VariantHeaderProps) {
  return (
    <s-stack direction="block" gap="small">
      <s-text>
        {productTitle} &rsaquo; {variantTitle}
      </s-text>
      <s-stack direction="inline" gap="small">
        {recommendedAction && <StatusBadge action={recommendedAction} />}
        {isSingleVariantProduct && <SingleVariantBadge />}
        {confidenceScore != null && (
          <s-text>Confidence: {Math.round(confidenceScore * 100)}%</s-text>
        )}
      </s-stack>
    </s-stack>
  );
}
