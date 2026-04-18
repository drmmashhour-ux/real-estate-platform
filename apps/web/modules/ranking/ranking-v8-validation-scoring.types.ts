/**
 * Ranking V8 validation scorecard — read-only rollout readiness (analytical only).
 */

export type RankingV8ValidationBand = "strong" | "acceptable" | "weak" | "unavailable";

export type RankingV8ValidationCategoryScore = {
  /** 0–5 */
  score: number;
  maxScore: number;
  band: RankingV8ValidationBand;
  detail: string;
};

export type RankingV8ValidationQualityMetrics = {
  /** Agreement rate for live vs shadow top-5 (0–1). */
  top5OverlapRate: number | null;
  top10OverlapRate: number | null;
  avgRankShift: number | null;
  /** Share of listings with material positive shadow signal (0–1); optional. */
  meaningfulImprovementRate: number | null;
};

export type RankingV8ValidationStabilityMetrics = {
  repeatQueryConsistency: number | null;
  top5ChurnRate: number | null;
  largeRankJumpRate: number | null;
};

export type RankingV8ValidationUserImpactMetrics = {
  /** Relative deltas vs baseline window (e.g. -0.03 = -3%); null = unavailable. */
  ctrDelta: number | null;
  saveRateDelta: number | null;
  contactRateDelta: number | null;
  leadRateDelta: number | null;
  bookingRateDelta: number | null;
};

export type RankingV8ValidationSafetyMetrics = {
  influenceSkipRate: number | null;
  shadowErrorRate: number | null;
  asyncFailureRate: number | null;
  rankingCrashCount: number | null;
  malformedObservationRate: number | null;
};

export type RankingV8ValidationCoverageMetrics = {
  highTrafficQueriesRepresented: boolean | null;
  lowTrafficQueriesRepresented: boolean | null;
  denseInventoryRepresented: boolean | null;
  sparseInventoryRepresented: boolean | null;
  cityZoneDiversityRepresented: boolean | null;
  priceRangeDiversityRepresented: boolean | null;
};

export type RankingV8ValidationInputs = {
  quality: RankingV8ValidationQualityMetrics;
  stability: RankingV8ValidationStabilityMetrics;
  userImpact: RankingV8ValidationUserImpactMetrics;
  safety: RankingV8ValidationSafetyMetrics;
  coverage: RankingV8ValidationCoverageMetrics;
  /** Optional context for logs / reports only. */
  meta?: {
    queriesAnalyzed?: number;
    listingsEvaluated?: number;
    windowLabel?: string;
  };
};

export type RankingV8ValidationDecision = "not_ready" | "phase_c_only" | "strong" | "production_ready";

export type RankingV8ValidationScorecard = {
  totalScore: number;
  maxScore: number;
  categoryScores: {
    quality: RankingV8ValidationCategoryScore;
    stability: RankingV8ValidationCategoryScore;
    userImpact: RankingV8ValidationCategoryScore;
    safety: RankingV8ValidationCategoryScore;
    coverage: RankingV8ValidationCategoryScore;
  };
  rawMetrics: RankingV8ValidationInputs;
  decision: RankingV8ValidationDecision;
  warnings: string[];
  notes: string[];
};

export type RankingV8ValidationWeeklyReport = {
  windowLabel?: string;
  queriesAnalyzed: number | null;
  listingsEvaluated: number | null;
  top5Overlap: number | null;
  top10Overlap: number | null;
  avgRankShift: number | null;
  ctrDelta: number | null;
  saveDelta: number | null;
  leadDelta: number | null;
  skipRate: number | null;
  errorRate: number | null;
  finalScore: number;
  decision: RankingV8ValidationDecision;
  categorySummary: string;
  warningCount: number;
};
