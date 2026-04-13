import { PricePositioningOutcome } from "@/modules/deal-analyzer/domain/comparables";

export function buildPhase2DecisionReasons(args: {
  phase1Recommendation: string;
  phase1Opportunity: string;
  trustComponent: number | null;
  riskScore: number;
  confidenceScore: number | null;
  positioningOutcome: string | null;
  scenarioConfidence: "low" | "medium" | "high" | null;
  bnhubRecommendation: string | null;
}): string[] {
  const reasons: string[] = [];
  reasons.push(`Phase 1 baseline: ${args.phase1Recommendation} / ${args.phase1Opportunity}.`);

  if (args.positioningOutcome === PricePositioningOutcome.ABOVE_COMPARABLE_RANGE) {
    reasons.push("Comparable band on this platform suggests the list price is above similar active listings.");
  } else if (args.positioningOutcome === PricePositioningOutcome.BELOW_COMPARABLE_RANGE) {
    reasons.push("Comparable band on this platform suggests the list price is below similar active listings.");
  } else if (args.positioningOutcome === PricePositioningOutcome.WITHIN_COMPARABLE_RANGE) {
    reasons.push("List price falls within the filtered comparable band on this platform.");
  } else if (args.positioningOutcome === PricePositioningOutcome.INSUFFICIENT_COMPARABLE_DATA) {
    reasons.push("Comparable coverage is thin — price positioning should be treated cautiously.");
  }

  if (args.scenarioConfidence === "low") {
    reasons.push("Cash-flow scenarios rely on weak rental inputs — illustrative only.");
  }

  if (args.bnhubRecommendation) {
    reasons.push(`BNHUB short-term overlay: ${args.bnhubRecommendation}.`);
  }

  if (typeof args.trustComponent === "number" && args.trustComponent < 45) {
    reasons.push("Trust/readiness signals are weak — caps aggressive recommendations.");
  }

  if (args.riskScore >= 70) {
    reasons.push("Elevated risk score pushes toward caution.");
  }

  if ((args.confidenceScore ?? 0) < 45) {
    reasons.push("Overall confidence is low — prefer review over strong opportunity labels.");
  }

  return reasons;
}
