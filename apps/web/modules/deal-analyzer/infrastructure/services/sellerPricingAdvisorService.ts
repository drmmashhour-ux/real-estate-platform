import { dealAnalyzerConfig } from "@/config/dealAnalyzer";
import { PricePositioningOutcome } from "@/modules/deal-analyzer/domain/comparables";
import { SellerPricePosition, SellerPricingAction } from "@/modules/deal-analyzer/domain/pricingAdvisor";

type SellerPricePositionValue = (typeof SellerPricePosition)[keyof typeof SellerPricePosition];
type SellerPricingActionValue = (typeof SellerPricingAction)[keyof typeof SellerPricingAction];
import { pricingAdjustmentReasons } from "@/modules/deal-analyzer/infrastructure/services/pricingAdjustmentReasonService";

export function buildSellerPricingAdvice(args: {
  positioningOutcome: string | null;
  compConfidence: string | null | undefined;
  trustScore: number | null;
  documentCompleteness: number;
  askCents?: number | null;
  medianPriceCents?: number | null;
}): {
  pricePosition: string;
  confidenceLevel: "low" | "medium" | "high";
  suggestedAction: string;
  reasons: string[];
  improvementActions: string[];
  explanation: string;
} {
  const cfg = dealAnalyzerConfig.phase3.pricingAdvisor;
  const reasons = pricingAdjustmentReasons({
    positioningOutcome: args.positioningOutcome,
    trustScore: args.trustScore,
    documentCompleteness: args.documentCompleteness,
  });

  let pricePosition: SellerPricePositionValue = SellerPricePosition.INSUFFICIENT_MARKET_DATA;
  let suggestedAction: SellerPricingActionValue = SellerPricingAction.GATHER_MORE_MARKET_EVIDENCE;
  let confidence: "low" | "medium" | "high" = "low";

  const p = args.positioningOutcome;
  const cc = args.compConfidence;

  if (p === PricePositioningOutcome.INSUFFICIENT_COMPARABLE_DATA || cc === "low") {
    confidence = "low";
    pricePosition = SellerPricePosition.INSUFFICIENT_MARKET_DATA;
    suggestedAction = SellerPricingAction.GATHER_MORE_MARKET_EVIDENCE;
  } else if (p === PricePositioningOutcome.ABOVE_COMPARABLE_RANGE) {
    let ratio = 1.06;
    if (args.askCents != null && args.medianPriceCents != null && args.medianPriceCents > 0) {
      ratio = args.askCents / args.medianPriceCents;
    }
    if (ratio >= cfg.meaningfullyHighMedianRatio) {
      pricePosition = SellerPricePosition.MEANINGFULLY_HIGH;
      suggestedAction = SellerPricingAction.REVIEW_COMPARABLE_POSITIONING;
    } else if (ratio >= cfg.slightlyHighMedianRatio) {
      pricePosition = SellerPricePosition.SLIGHTLY_HIGH;
      suggestedAction = SellerPricingAction.REVIEW_COMPARABLE_POSITIONING;
    } else {
      pricePosition = SellerPricePosition.SLIGHTLY_HIGH;
      suggestedAction = SellerPricingAction.REVIEW_COMPARABLE_POSITIONING;
    }
    confidence = cc === "high" ? "high" : "medium";
  } else if (p === PricePositioningOutcome.BELOW_COMPARABLE_RANGE) {
    pricePosition = SellerPricePosition.COMPETITIVELY_POSITIONED;
    suggestedAction = SellerPricingAction.KEEP_CURRENT_PRICE;
    confidence = "medium";
  } else if (p === PricePositioningOutcome.WITHIN_COMPARABLE_RANGE) {
    pricePosition = SellerPricePosition.COMPETITIVELY_POSITIONED;
    suggestedAction = SellerPricingAction.KEEP_CURRENT_PRICE;
    confidence = cc === "high" ? "high" : "medium";
  }

  if ((args.trustScore ?? 0) < 50 || args.documentCompleteness < 0.75) {
    suggestedAction = SellerPricingAction.IMPROVE_TRUST_COMPLETENESS;
  }

  const improvementActions = [
    "Complete seller verification and required documents where possible.",
    "Add clear photos and accurate property details to support buyer confidence.",
  ];

  const explanation = [
    dealAnalyzerConfig.phase3.disclaimers.pricingAdvisor,
    "Pricing attractiveness depends on buyer perception, not list price alone.",
  ].join(" ");

  return {
    pricePosition,
    confidenceLevel: confidence,
    suggestedAction,
    reasons,
    improvementActions,
    explanation,
  };
}
