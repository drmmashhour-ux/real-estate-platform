import { dealAnalyzerConfig } from "@/config/dealAnalyzer";
import { PricePositioningOutcome } from "@/modules/deal-analyzer/domain/comparables";
import { DealRecommendation, OpportunityType } from "@/modules/deal-analyzer/domain/enums";

/**
 * Deterministic refinement on top of Phase 1 labels — does not replace Phase 1 scoring engine.
 */
export function refineDealDecision(args: {
  trustComponent: number | null;
  riskScore: number;
  confidenceScore: number | null;
  positioningOutcome: string | null;
  phase1Recommendation: string;
  phase1Opportunity: string;
  bnhubCandidate: boolean;
}): { recommendation: string; opportunity: string } {
  const d = dealAnalyzerConfig.decision;
  const lowTrust = (args.trustComponent ?? 0) < d.lowTrustMax;
  const lowConf = (args.confidenceScore ?? 0) < 45;
  const highRisk = args.riskScore >= d.highRiskMin;
  const overpriced = args.positioningOutcome === PricePositioningOutcome.ABOVE_COMPARABLE_RANGE;
  const weakComps = args.positioningOutcome === PricePositioningOutcome.INSUFFICIENT_COMPARABLE_DATA;

  let recommendation = args.phase1Recommendation;
  let opportunity = args.phase1Opportunity;

  if (lowConf && weakComps) {
    recommendation = DealRecommendation.INSUFFICIENT_DATA;
    opportunity = OpportunityType.INSUFFICIENT_DATA;
  } else if (lowConf || weakComps) {
    recommendation = DealRecommendation.WORTH_REVIEWING;
  }

  if (lowTrust && recommendation === DealRecommendation.STRONG_OPPORTUNITY) {
    recommendation = DealRecommendation.WORTH_REVIEWING;
  }

  if (overpriced) {
    opportunity = OpportunityType.OVERPRICED;
    if (recommendation === DealRecommendation.STRONG_OPPORTUNITY) {
      recommendation = DealRecommendation.CAUTION;
    }
  }

  if (highRisk && opportunity !== OpportunityType.INSUFFICIENT_DATA) {
    opportunity = OpportunityType.HIGH_RISK;
    if (recommendation === DealRecommendation.STRONG_OPPORTUNITY) {
      recommendation = DealRecommendation.CAUTION;
    }
  }

  if (
    args.bnhubCandidate &&
    opportunity !== OpportunityType.INSUFFICIENT_DATA &&
    opportunity !== OpportunityType.OVERPRICED &&
    opportunity !== OpportunityType.HIGH_RISK
  ) {
    opportunity = OpportunityType.BNHUB_CANDIDATE;
  }

  return { recommendation, opportunity };
}
