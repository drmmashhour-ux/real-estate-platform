/**
 * Order decisions: timing urgency → revenue/closing upside → dependency risk reduction.
 */

import type { AdaptiveDecision, AdaptiveDecisionCategory } from "@/modules/growth/adaptive-intelligence.types";

const urgencyRank: Record<string, number> = {
  critical: 4,
  high: 3,
  medium: 2,
};

const categoryBoost: Record<AdaptiveDecisionCategory, number> = {
  timing: 30,
  closing: 25,
  routing: 18,
  retention: 15,
  growth: 10,
};

/** Higher score sorts earlier. */
function scoreDecision(d: AdaptiveDecision): number {
  const u = urgencyRank[d.priority] ?? 1;
  const c =
    d.confidence === "high" ? 3 : d.confidence === "medium" ? 2 : 1;
  const cat = categoryBoost[d.category];
  return u * 100 + cat + c * 5;
}

export function prioritizeAdaptiveDecisions(decisions: AdaptiveDecision[]): AdaptiveDecision[] {
  return [...decisions].sort((a, b) => scoreDecision(b) - scoreDecision(a));
}
