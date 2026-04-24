import type { LecipmOpportunityRiskTier } from "@prisma/client";
import type { OpportunityDiscoveryWeights } from "./opportunity.types";
import { DEFAULT_OPPORTUNITY_WEIGHTS } from "./opportunity.types";

export function clampScore(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function mergeWeights(partial?: Partial<OpportunityDiscoveryWeights>): OpportunityDiscoveryWeights {
  return { ...DEFAULT_OPPORTUNITY_WEIGHTS, ...partial };
}

/** Combine normalized 0–1 sub-scores with weights; then apply risk penalty to final. */
export function compositeOpportunityScore(
  components: {
    valueGap?: number;
    conversion?: number;
    urgency?: number;
    financing?: number;
    esgUpside?: number;
    investorMatch?: number;
    bookingUpside?: number;
  },
  riskLevel: LecipmOpportunityRiskTier,
  weights: OpportunityDiscoveryWeights = DEFAULT_OPPORTUNITY_WEIGHTS,
): number {
  const v = (x?: number) => Math.max(0, Math.min(1, x ?? 0));
  let raw =
    v(components.valueGap) * weights.valueGap +
    v(components.conversion) * weights.conversion +
    v(components.urgency) * weights.urgency +
    v(components.financing) * weights.financing +
    v(components.esgUpside) * weights.esgUpside +
    v(components.investorMatch) * weights.investorMatch +
    v(components.bookingUpside) * weights.bookingUpside;

  const denom =
    weights.valueGap +
    weights.conversion +
    weights.urgency +
    weights.financing +
    weights.esgUpside +
    weights.investorMatch +
    weights.bookingUpside;
  raw = denom > 0 ? raw / denom : 0;
  let score = raw * 100;

  const penalty =
    riskLevel === "HIGH" ? 22
    : riskLevel === "MEDIUM" ? 10
    : 0;
  score -= penalty * weights.riskPenalty;

  return clampScore(score);
}

export function deriveConfidence(dataQuality: "high" | "medium" | "low", signalCount: number): number {
  const base = dataQuality === "high" ? 72 : dataQuality === "medium" ? 58 : 42;
  const bonus = Math.min(18, signalCount * 3);
  return clampScore(base + bonus);
}

export function boostForIntent(baseScore: number, intentBoost01: number): number {
  return clampScore(baseScore + intentBoost01 * 15);
}
