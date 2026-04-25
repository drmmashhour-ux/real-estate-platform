import type { StrategyBenchmarkDomain } from "@prisma/client";
import type { OfferStrategyOutput } from "@/modules/offer-strategy/offer-strategy.types";
import type { NegotiationScenario } from "@/modules/negotiation-simulator/negotiation-simulator.types";
import { getStrategyPerformance, performanceNudgeFactor } from "./strategy-performance.service";

/**
 * Soft re-ordering of offer recommendations — never replaces base engine output.
 */
export async function applyOfferStrategyLearningNudge(
  out: OfferStrategyOutput,
  domain: StrategyBenchmarkDomain = "OFFER"
): Promise<OfferStrategyOutput> {
  try {
    const scored = await Promise.all(
      out.recommendations.map(async (r) => {
        const p = await getStrategyPerformance(r.key, domain);
        const n = performanceNudgeFactor(p);
        return { r, n };
      })
    );
    const copy = scored
      .sort((a, b) => b.n - a.n)
      .map((x) => x.r);
    if (copy.length === 0) return out;
    return { ...out, recommendations: copy };
  } catch {
    return out;
  }
}

/**
 * Tiny confidence nudges on scenarios — cap total shift so heuristics stay primary.
 */
export async function applyNegotiationScenarioNudges(
  scenarios: NegotiationScenario[],
  domain: StrategyBenchmarkDomain = "NEGOTIATION"
): Promise<NegotiationScenario[]> {
  try {
    return await Promise.all(
      scenarios.map(async (s) => {
        const p = await getStrategyPerformance(s.approachKey, domain);
        const n = performanceNudgeFactor(p);
        return {
          ...s,
          confidence: Math.max(0.1, Math.min(0.95, s.confidence + n * 0.2)),
        };
      })
    );
  } catch {
    return scenarios;
  }
}

export type CloserAction = { key: string; title: string; priority: "low" | "medium" | "high"; rationale: string[] };

/**
 * Re-order next close actions with a soft performance hint.
 */
export async function applyDealCloserLearningNudge<T extends { key: string }>(actions: T[]): Promise<T[]> {
  try {
    const withN = await Promise.all(
      actions.map(async (a) => {
        const p = await getStrategyPerformance(a.key, "CLOSING");
        return { a, n: performanceNudgeFactor(p) };
      })
    );
    return withN.sort((x, y) => y.n - x.n).map((x) => x.a);
  } catch {
    return actions;
  }
}
