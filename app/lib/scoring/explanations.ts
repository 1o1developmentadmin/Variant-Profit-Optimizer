/**
 * Explanation Generator — EPIC-04
 *
 * Produces human-readable recommendation explanations with structured reason codes.
 */

export type ReasonCode =
  | "high_performance"
  | "healthy_margin"
  | "margin_data_unavailable"
  | "low_refund_risk"
  | "healthy_stock"
  | "weak_margin"
  | "high_refund_risk"
  | "stock_risk"
  | "no_sibling_comparison";

export interface ExplanationInput {
  variantTitle: string;
  recommendedAction: string;
  performanceScore: number;
  profitScore: number | null;
  refundScore: number;
  inventoryScore: number;
  confidenceScore: number;
  hasCostData: boolean;
  isSingleVariantProduct: boolean;
  marginPct: number | null;
  unitsSold: number;
}

export interface ExplanationJson {
  whatWeRecommend: string;
  whyWeRecommendIt: string;
  riskIfIgnored: string;
  reasonCodes: ReasonCode[];
  dataSupporting: Record<string, number | string | null>;
}

// ---------------------------------------------------------------------------
// Reason code generation
// ---------------------------------------------------------------------------

function buildReasonCodes(input: ExplanationInput): ReasonCode[] {
  const codes: ReasonCode[] = [];

  if (input.performanceScore >= 0.65) codes.push("high_performance");
  if (input.profitScore != null && input.profitScore >= 0.6) codes.push("healthy_margin");
  if (!input.hasCostData) codes.push("margin_data_unavailable");
  if (input.refundScore >= 0.7) codes.push("low_refund_risk");
  if (input.inventoryScore >= 0.7) codes.push("healthy_stock");
  if (input.profitScore != null && input.profitScore < 0.4) codes.push("weak_margin");
  if (input.refundScore <= 0.4) codes.push("high_refund_risk");
  if (input.inventoryScore <= 0.4) codes.push("stock_risk");
  if (input.isSingleVariantProduct) codes.push("no_sibling_comparison");

  return codes;
}

// ---------------------------------------------------------------------------
// Action text templates
// ---------------------------------------------------------------------------

interface ActionText {
  what: string;
  why: string;
  risk: string;
}

function getActionText(
  action: string,
  variantTitle: string,
  confidenceScore: number,
): ActionText {
  const lowConfidence = confidenceScore < 0.5;
  const prefix = lowConfidence ? "Possible opportunity: " : "";

  const templates: Record<string, ActionText> = {
    push: {
      what: `${prefix}Increase visibility and marketing for "${variantTitle}"`,
      why: "This variant shows strong performance and healthy margins relative to its peers.",
      risk: lowConfidence
        ? "Limited data means this signal may not be fully reliable yet."
        : "Failing to capitalise could mean missed revenue from a high-potential variant.",
    },
    restock_soon: {
      what: `${prefix}Restock "${variantTitle}" before stock runs out`,
      why: "Current inventory levels are low relative to recent sales velocity.",
      risk: "Stockout will directly block sales and may permanently redirect customers to alternatives.",
    },
    deprioritize: {
      what: `${prefix}Consider reducing focus on "${variantTitle}"`,
      why: "This variant shows weak performance relative to other variants in the product range.",
      risk: lowConfidence
        ? "Low confidence — review manually before acting."
        : "Continuing to invest in a low-opportunity variant may reduce overall profitability.",
    },
    investigate_refunds: {
      what: `${prefix}Review refund patterns for "${variantTitle}"`,
      why: "Refund rate for this variant is elevated compared to typical.",
      risk: "Unresolved refund drivers increase costs and may indicate quality or expectation issues.",
    },
    review_pricing: {
      what: `${prefix}Review pricing for "${variantTitle}"`,
      why: "Margin on this variant is below the recommended threshold.",
      risk: "Continuing at the current price may erode profitability as costs fluctuate.",
    },
    needs_more_data: {
      what: `Needs more data: "${variantTitle}" cannot be reliably scored yet`,
      why: "Insufficient sales history, cost data, or inventory tracking to generate a confident recommendation.",
      risk: "No immediate action needed, but ensure cost and inventory data is set up for future analysis.",
    },
    no_action: {
      what: `"${variantTitle}" is performing within expected parameters`,
      why: "No significant issues or opportunities detected in the current scoring window.",
      risk: "Continue to monitor — performance can change with seasonal shifts or competitor activity.",
    },
  };

  return (
    templates[action] ?? {
      what: `Review "${variantTitle}"`,
      why: "An automated signal has been detected for this variant.",
      risk: "Review the supporting data to determine the appropriate action.",
    }
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function generateExplanation(input: ExplanationInput): ExplanationJson {
  const reasonCodes = buildReasonCodes(input);
  const actionText = getActionText(
    input.recommendedAction,
    input.variantTitle,
    input.confidenceScore,
  );

  return {
    whatWeRecommend: actionText.what,
    whyWeRecommendIt: actionText.why,
    riskIfIgnored: actionText.risk,
    reasonCodes,
    dataSupporting: {
      unitsSold: input.unitsSold,
      marginPct: input.marginPct,
      performanceScore: input.performanceScore,
      profitScore: input.profitScore,
      refundScore: input.refundScore,
      inventoryScore: input.inventoryScore,
      confidenceScore: input.confidenceScore,
    },
  };
}
