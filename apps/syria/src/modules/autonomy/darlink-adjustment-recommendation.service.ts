/**
 * Human-in-the-loop tuning hints — never auto-applied.
 */

import type { MarketplaceOutcomeFeedback } from "./darlink-marketplace-autonomy.types";

export type AutonomyAdjustmentRecommendation = {
  id: string;
  domain: "thresholds" | "ranking_weights" | "signals" | "priorities";
  recommendation: string;
  confidence: "low" | "medium";
};

export function buildAutonomyAdjustmentRecommendations(
  feedback: MarketplaceOutcomeFeedback,
): readonly AutonomyAdjustmentRecommendation[] {
  try {
    const out: AutonomyAdjustmentRecommendation[] = [];
    if ((feedback.trustRiskFlagsCount ?? 0) >= 5) {
      out.push({
        id: "adj-trust-1",
        domain: "signals",
        recommendation: "Tighten fraud/trust detector thresholds slightly — elevated flags in window.",
        confidence: "medium",
      });
    }
    if (feedback.viewsToLeadsRatio !== null && feedback.viewsToLeadsRatio < 0.02) {
      out.push({
        id: "adj-funnel-1",
        domain: "priorities",
        recommendation: "Prioritize inquiry response tooling — weak views-to-lead conversion proxy.",
        confidence: "low",
      });
    }
    return out.slice(0, 12);
  } catch {
    return [];
  }
}
