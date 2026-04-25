import { negSimLog } from "./negotiation-simulator-logger";
import type { MomentumRiskResult, NegotiationScenario, NegotiationSimulatorContext } from "./negotiation-simulator.types";

const riskScore = (o: NegotiationScenario["expectedOutcome"]): number => {
  if (o === "pushback_risk") return 3;
  if (o === "stall_risk") return 2;
  if (o === "neutral_progress") return 1;
  return 0; // positive_progress
};

function avgReadiness(c: NegotiationSimulatorContext | undefined): number | null {
  if (!c) return null;
  const a = c.offerReadinessScore;
  const b = c.closingReadinessScore;
  if (typeof a === "number" && typeof b === "number") return Math.max(0, Math.min(1, (a + b) / 2));
  if (typeof a === "number") return Math.max(0, Math.min(1, a));
  if (typeof b === "number") return Math.max(0, Math.min(1, b));
  return null;
}

/** Readiness is “weak” when average score is low or deal-probability is very low in CRM-style data (heuristic, not a forecast). */
export function isReadinessWeakForSelector(c: NegotiationSimulatorContext | undefined): boolean {
  if (!c) return false;
  const p = c.dealProbability;
  if (typeof p === "number" && p < 0.3) return true;
  const r = avgReadiness(c);
  if (r != null && r < 0.38) return true;
  return false;
}

/**
 * Suggestions only. Safest = fewest stall/pushback signals in the heuristic;
 * highest-upside = strongest positive_progress, adjusted for momentum and aggressive penalties.
 */
export function selectBestNegotiationApproaches(
  scenarios: NegotiationScenario[],
  momentumRisk: MomentumRiskResult,
  context?: NegotiationSimulatorContext
): { safestApproach: string | null; highestUpsideApproach: string | null } {
  if (scenarios.length === 0) {
    return { safestApproach: null, highestUpsideApproach: null };
  }

  const weak = isReadinessWeakForSelector(context);

  const safeKey = (s: NegotiationScenario) => {
    let t = riskScore(s.expectedOutcome) * 10 - s.confidence * 2;
    if (s.approachKey === "timing_pause" && momentumRisk.level === "high") t += 3;
    if (momentumRisk.level === "high" && (s.approachKey === "firm_follow_up" || s.approachKey === "offer_discussion_now")) t += 1.5;
    if (weak && (s.approachKey === "firm_follow_up" || s.approachKey === "offer_discussion_now")) t += 4;
    if (weak && s.approachKey === "offer_discussion_now" && s.expectedOutcome !== "positive_progress") t += 2;
    if (momentumRisk.level === "low" && s.approachKey === "objection_first" && s.expectedOutcome === "pushback_risk")
      t += 0; /* as-is */
    return t;
  };

  const bySafe = [...scenarios].sort((a, b) => safeKey(a) - safeKey(b));
  const safestApproach: string | null = bySafe[0]?.approachKey ?? null;

  const pos = scenarios
    .filter((s) => s.expectedOutcome === "positive_progress")
    .map((s) => {
      let w = s.confidence * 100;
      if (momentumRisk.level === "high" && s.approachKey === "timing_pause") w -= 20;
      if (momentumRisk.level === "high" && s.approachKey === "visit_push") w += 5;
      if (momentumRisk.level === "low" && s.approachKey === "value_reinforcement") w += 2;
      if (weak && s.approachKey === "offer_discussion_now") w -= 25;
      if (weak && s.approachKey === "firm_follow_up") w -= 10;
      return { s, w };
    })
    .sort((a, b) => b.w - a.w);

  let highestUpsideApproach: string | null = pos[0]?.s.approachKey ?? null;
  if (!highestUpsideApproach) {
    const nextBest = scenarios
      .filter((s) => s.expectedOutcome === "neutral_progress")
      .sort((a, b) => b.confidence - a.confidence);
    highestUpsideApproach = nextBest[0]?.approachKey ?? null;
  }

  negSimLog.bestSelected({ safest: safestApproach, highestUpside: highestUpsideApproach, momentum: momentumRisk.level });
  return { safestApproach, highestUpsideApproach };
}
