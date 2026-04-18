/**
 * Explainable status bands for host listing performance — rules only, no side effects.
 */

import type { BNHubListingScoreBreakdown } from "@/modules/bnhub/ranking/bnhub-ranking.types";
import type { BNHubHostListingPerformanceStatus } from "./host-performance.types";

export type ClassifyHostListingPerformanceInput = {
  rankingScore?: number;
  breakdown?: Partial<BNHubListingScoreBreakdown>;
  weakSignals: string[];
  strongSignals: string[];
  /** When false, scores are heuristic / partial — classifier stays conservative. */
  hasFullRanking: boolean;
};

/**
 * Maps composite score + signal counts to a single status for host UX.
 */
export function classifyHostListingPerformance(input: ClassifyHostListingPerformanceInput): BNHubHostListingPerformanceStatus {
  const score = input.rankingScore;
  const w = input.weakSignals.length;
  const s = input.strongSignals.length;

  if (!input.hasFullRanking || score == null || !Number.isFinite(score)) {
    if (w >= 4) return "weak";
    if (w >= 2) return "watch";
    return "healthy";
  }

  if (score >= 70 && w <= 1 && s >= 1) return "strong";
  if (score >= 70 && w <= 2) return "healthy";
  if (score >= 40 && score < 70) {
    if (w >= 3) return "watch";
    return "healthy";
  }
  if (score >= 25 && score < 40) return "watch";
  return "weak";
}
