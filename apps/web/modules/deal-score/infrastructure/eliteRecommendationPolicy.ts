import { DealRecommendation } from "@/modules/deal-analyzer/domain/enums";
import type { EliteRecommendationPolicy } from "@/modules/scoring/tuningProfile";

function downgradeOne(
  r: (typeof DealRecommendation)[keyof typeof DealRecommendation],
): (typeof DealRecommendation)[keyof typeof DealRecommendation] {
  if (r === DealRecommendation.STRONG_OPPORTUNITY) return DealRecommendation.WORTH_REVIEWING;
  if (r === DealRecommendation.WORTH_REVIEWING) return DealRecommendation.CAUTION;
  if (r === DealRecommendation.CAUTION) return DealRecommendation.AVOID;
  return r;
}

/**
 * Deterministic recommendation mapping — defaults match legacy `pickEliteRecommendation` behavior.
 */
export function pickEliteRecommendationWithPolicy(
  args: {
    dealConfidence: number;
    finalTrustScore: number;
    finalDealScore: number;
    fraudScore?: number | null;
    comparableCount?: number;
  },
  p: EliteRecommendationPolicy,
): (typeof DealRecommendation)[keyof typeof DealRecommendation] {
  if (args.dealConfidence < p.insufficientDataConfidenceMax) {
    return DealRecommendation.INSUFFICIENT_DATA;
  }

  if (p.trustCapRecommendationBelow != null && args.finalTrustScore < p.trustCapRecommendationBelow) {
    if (args.finalDealScore >= p.cautionScoreMin) return DealRecommendation.CAUTION;
    return DealRecommendation.AVOID;
  }

  if (args.finalTrustScore < p.trustBelowReturnsCaution) {
    return DealRecommendation.CAUTION;
  }

  let r: (typeof DealRecommendation)[keyof typeof DealRecommendation];
  if (args.finalDealScore >= p.strongScoreMin && args.dealConfidence >= p.strongConfidenceMin) {
    r = DealRecommendation.STRONG_OPPORTUNITY;
  } else if (
    args.finalDealScore >= p.worthReviewingScoreMin &&
    args.dealConfidence < p.strongConfidenceMin &&
    args.dealConfidence >= p.insufficientDataConfidenceMax
  ) {
    r = DealRecommendation.WORTH_REVIEWING;
  } else if (args.finalDealScore >= p.cautionScoreMin) {
    r = DealRecommendation.CAUTION;
  } else {
    r = DealRecommendation.AVOID;
  }

  if (p.minConfidenceForStrongOpportunity != null && r === DealRecommendation.STRONG_OPPORTUNITY) {
    if (args.dealConfidence < p.minConfidenceForStrongOpportunity) {
      r =
        args.finalDealScore >= p.worthReviewingScoreMin && args.dealConfidence >= p.insufficientDataConfidenceMax
          ? DealRecommendation.WORTH_REVIEWING
          : DealRecommendation.CAUTION;
    }
  }

  if (p.fraudScoreDowngradeAt != null && args.fraudScore != null && args.fraudScore >= p.fraudScoreDowngradeAt) {
    r = downgradeOne(r);
  }

  if (
    p.minComparablesForStrongOpportunity != null &&
    (args.comparableCount ?? 0) < p.minComparablesForStrongOpportunity &&
    r === DealRecommendation.STRONG_OPPORTUNITY
  ) {
    r = DealRecommendation.WORTH_REVIEWING;
  }

  return r;
}
