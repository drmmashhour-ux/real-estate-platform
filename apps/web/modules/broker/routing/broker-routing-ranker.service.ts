/**
 * Deterministic candidate ordering — max 5; no assignment side effects.
 */

import type { BrokerRoutingCandidate } from "./broker-routing.types";

export function rankBrokerRoutingCandidates(
  candidates: BrokerRoutingCandidate[],
  /** Default 5 — advisory panel; distribution may request a larger pool before narrowing. */
  max = 5,
): BrokerRoutingCandidate[] {
  const sorted = [...candidates].sort((a, b) => {
    if (b.rankScore !== a.rankScore) return b.rankScore - a.rankScore;
    if (b.breakdown.performanceFitScore !== a.breakdown.performanceFitScore) {
      return b.breakdown.performanceFitScore - a.breakdown.performanceFitScore;
    }
    if (b.breakdown.responseFitScore !== a.breakdown.responseFitScore) {
      return b.breakdown.responseFitScore - a.breakdown.responseFitScore;
    }
    return a.brokerId.localeCompare(b.brokerId);
  });
  return sorted.slice(0, max);
}
