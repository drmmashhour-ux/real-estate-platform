/**
 * Ranking V8 governance dashboard payload — read-only aggregation for admin UI.
 */

import type { RankingV8ValidationDecision } from "./ranking-v8-validation-scoring.types";

export type RankingV8GovernanceRecommendation =
  | "stay_in_shadow"
  | "phase_c_only"
  | "expand_phase_c"
  | "candidate_for_primary"
  | "rollback_recommended";

export type RankingV8GovernanceReadiness = {
  qualityReady: boolean;
  stabilityReady: boolean;
  safetyReady: boolean;
  coverageReady: boolean;
  /** When user-impact data was mostly unavailable, false with note in warnings. */
  userImpactReady: boolean;
  userImpactNa: boolean;
};

export type RankingV8GovernancePayload = {
  scorecard: {
    totalScore: number;
    maxScore: number;
    categoryScores: {
      quality: number;
      stability: number;
      userImpact: number;
      safety: number;
      coverage: number;
    };
    rawMetrics?: {
      quality?: Record<string, number | null>;
      stability?: Record<string, number | null>;
      userImpact?: Record<string, number | null>;
      safety?: Record<string, number | null>;
      coverage?: Record<string, boolean | null>;
    };
    decision: RankingV8ValidationDecision;
  };
  rollout: {
    currentPhase: string | null;
    recommendation: RankingV8GovernanceRecommendation;
    targetPhase: string | null;
    readiness: RankingV8GovernanceReadiness;
    blockingReasons: string[];
    warnings: string[];
  };
  metrics: {
    top5Overlap: number | null;
    top10Overlap: number | null;
    avgRankShift: number | null;
    top5ChurnRate: number | null;
    repeatConsistency: number | null;
    largeJumpRate: number | null;
    ctrDelta: number | null;
    saveDelta: number | null;
    leadDelta: number | null;
  };
  coverage: {
    highTraffic: boolean | null;
    lowTraffic: boolean | null;
    denseInventory: boolean | null;
    sparseInventory: boolean | null;
    geoDiversity: boolean | null;
    priceDiversity: boolean | null;
  };
  rollbackSignals: {
    severeOverlapDrop: boolean;
    instabilitySpike: boolean;
    errorPresent: boolean;
    negativeUserImpact: boolean;
  };
  history: Array<{ ts: string; totalScore: number; decision: RankingV8ValidationDecision; recommendation: RankingV8GovernanceRecommendation }>;
  meta: {
    dataFreshnessMs: number | null;
    sourcesUsed: string[];
    missingSources: string[];
    queryFingerprintLatest: string | null;
  };
};
