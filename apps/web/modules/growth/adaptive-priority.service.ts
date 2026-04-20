/**
 * Order decisions (deterministic):
 * 1) Timing / urgency (implicit in `priority` + timing category boost)
 * 2) Revenue-leaning upside (closing, routing toward high-value)
 * 3) Risk reduction (retention, dependency)
 */

import type { AdaptiveDecision, AdaptiveDecisionCategory } from "@/modules/growth/adaptive-intelligence.types";

const urgencyRank: Record<string, number> = {
  critical: 4,
  high: 3,
  medium: 2,
};

/** Base lane weights — timing first, then closing/revenue, then risk layers. */
const categoryBoost: Record<AdaptiveDecisionCategory, number> = {
  timing: 32,
  closing: 26,
  routing: 18,
  retention: 14,
  growth: 9,
};

/** Secondary nudge: closing/routing reflect pipeline revenue leverage; retention reflects dependency risk. */
const revenueLean: Partial<Record<AdaptiveDecisionCategory, number>> = {
  closing: 8,
  routing: 5,
  growth: 2,
};

const riskLean: Partial<Record<AdaptiveDecisionCategory, number>> = {
  retention: 7,
  routing: 4,
};

/** Higher score sorts earlier. */
function scoreDecision(d: AdaptiveDecision): number {
  const u = urgencyRank[d.priority] ?? 1;
  const c =
    d.confidence === "high" ? 3 : d.confidence === "medium" ? 2 : 1;
  const cat = categoryBoost[d.category];
  const rev = revenueLean[d.category] ?? 0;
  const risk = riskLean[d.category] ?? 0;
  return u * 100 + cat + rev + risk + c * 5;
}

export function prioritizeAdaptiveDecisions(decisions: AdaptiveDecision[]): AdaptiveDecision[] {
  return [...decisions].sort((a, b) => scoreDecision(b) - scoreDecision(a));
}
