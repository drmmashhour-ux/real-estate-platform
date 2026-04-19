/**
 * [adaptive-intelligence] — never throws.
 */

import type { AdaptiveDecision, AdaptiveDecisionCategory } from "@/modules/growth/adaptive-intelligence.types";

const P = "[adaptive-intelligence]";

export function logAdaptiveIntelligenceBuilt(params: {
  decisionCount: number;
  byCategory: Record<AdaptiveDecisionCategory, number>;
  lowConfidence: number;
}): void {
  try {
    console.info(
      `${P} decisions=${params.decisionCount} low_confidence=${params.lowConfidence} closing=${params.byCategory.closing} timing=${params.byCategory.timing} retention=${params.byCategory.retention} routing=${params.byCategory.routing} growth=${params.byCategory.growth}`,
    );
  } catch {
    /* ignore */
  }
}

export function logAdaptiveIntelligenceSparse(): void {
  try {
    console.info(`${P} sparse_signals=true`);
  } catch {
    /* ignore */
  }
}

export function countByCategory(decisions: AdaptiveDecision[]): Record<AdaptiveDecisionCategory, number> {
  const z: Record<AdaptiveDecisionCategory, number> = {
    closing: 0,
    timing: 0,
    retention: 0,
    routing: 0,
    growth: 0,
  };
  for (const d of decisions) z[d.category] += 1;
  return z;
}
