/** Ranking v2 — implementation under `@/src/modules/ranking/v2`. */
export * from "@/src/modules/ranking/v2/ranking.types";
export * from "@/src/modules/ranking/v2/constants";
export { blendRankingV2Score, buildV2Breakdown } from "@/src/modules/ranking/v2/scoring";
export { explainRankingV2 } from "@/src/modules/ranking/v2/ranking.explainer";
export { ensureSignalDefaults } from "@/src/modules/ranking/v2/ranking-fallbacks";
export { computeFsboRankingV2, computeBnhubRankingV2, computeRankingV2FromSignals } from "@/src/modules/ranking/v2/ranking.service";

/** LECIPM Reputation + Ranking Engine v1 — additive facade (does not replace v2 signals). */
export { computeReputationRankingForListing } from "./ranking-engine.service";
export type { UnifiedRankingExplanation, ReputationRankingFactors } from "./ranking-factors.service";
export { buildUnifiedRankingExplanation } from "./ranking-factors.service";
export { toPublicTrustIndicators } from "./ranking-explainer.service";
export { searchListingsWithOptionalReputationRank } from "./search-ranking.service";
export { scheduleRankingV8ShadowEvaluation } from "./ranking-v8-shadow-observer.service";
export type { ScheduleRankingV8ShadowInput } from "./ranking-v8-shadow-observer.service";
export { computeShadowListingRank01, summarizeRankingV8ShadowDiffs } from "./ranking-v8-shadow-evaluator.service";
export type { RankingV8ShadowDiffRow, RankingV8ShadowEvaluationSummary } from "./ranking-v8-shadow.types";
export {
  compareRankingV8LiveVsShadow,
  deriveShadowOrderFromShadowRows,
  logRankingV8Comparison,
} from "./ranking-v8-comparison.service";
export type {
  RankingV8ComparisonResult,
  RankingV8ComparisonSummary,
  RankingV8RankShiftRow,
} from "./ranking-v8-comparison.types";
export {
  applyRankingV8Influence,
  logRankingV8Influence,
  RANKING_V8_INFLUENCE_MAX_SWAPS_PER_LISTING,
  RANKING_V8_INFLUENCE_TOP_ZONE,
} from "./ranking-v8-influence.service";
export type { ApplyRankingV8InfluenceInput, ApplyRankingV8InfluenceOutput } from "./ranking-v8-influence.service";
export type { RankingV8InfluenceResult } from "./ranking-v8-influence.types";
export type { RankingV8ShadowInfluenceMeta } from "./ranking-v8-shadow.types";
export {
  buildRankingV8ValidationScorecard,
  buildRankingV8ValidationWeeklyReport,
  logRankingV8ValidationScorecard,
} from "./ranking-v8-validation-scoring.service";
export { buildRankingV8ValidationInputsFromComparison } from "./ranking-v8-validation-scoring-bridge";
export type {
  RankingV8ValidationInputs,
  RankingV8ValidationScorecard,
  RankingV8ValidationWeeklyReport,
  RankingV8ValidationDecision,
} from "./ranking-v8-validation-scoring.types";
export { runRankingV8ValidationScoringIfEnabled } from "./ranking-v8-validation-scoring-runner";
export { recordRankingSnapshotFromExplanation } from "./ranking-snapshot.service";
export { loadRankingV8GovernancePayload } from "./ranking-v8-governance.service";
export type { LoadRankingV8GovernanceParams } from "./ranking-v8-governance.service";
export type { RankingV8GovernancePayload } from "./ranking-v8-governance.types";
