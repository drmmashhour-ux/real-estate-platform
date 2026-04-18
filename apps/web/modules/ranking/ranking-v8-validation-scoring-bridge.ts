/**
 * Assembles validation scorecard inputs from existing Ranking V8 / analytics artifacts — read-only.
 */
import type { RankingV8ComparisonResult } from "./ranking-v8-comparison.types";
import type {
  RankingV8ValidationCoverageMetrics,
  RankingV8ValidationInputs,
  RankingV8ValidationSafetyMetrics,
  RankingV8ValidationStabilityMetrics,
  RankingV8ValidationUserImpactMetrics,
} from "./ranking-v8-validation-scoring.types";

export type BridgeFromComparisonOptions = {
  /** Optional share of listings with positive shadow delta (0–1); do not guess — omit if unknown. */
  meaningfulImprovementRate?: number | null;
  stability?: Partial<RankingV8ValidationStabilityMetrics>;
  userImpact?: Partial<RankingV8ValidationUserImpactMetrics>;
  safety?: Partial<RankingV8ValidationSafetyMetrics>;
  coverage?: Partial<RankingV8ValidationCoverageMetrics>;
  meta?: RankingV8ValidationInputs["meta"];
};

/**
 * Map live vs shadow comparison summary into quality metrics. Does not mutate `comparison`.
 */
export function buildRankingV8ValidationInputsFromComparison(
  comparison: RankingV8ComparisonResult | null,
  options: BridgeFromComparisonOptions = {},
): RankingV8ValidationInputs {
  const q = comparison
    ? {
        top5OverlapRate: comparison.agreementRateTop5,
        top10OverlapRate: comparison.agreementRateTop10,
        avgRankShift: comparison.avgRankShift,
        meaningfulImprovementRate: options.meaningfulImprovementRate ?? null,
      }
    : {
        top5OverlapRate: null,
        top10OverlapRate: null,
        avgRankShift: null,
        meaningfulImprovementRate: options.meaningfulImprovementRate ?? null,
      };

  const stability: RankingV8ValidationStabilityMetrics = {
    repeatQueryConsistency: options.stability?.repeatQueryConsistency ?? null,
    top5ChurnRate: options.stability?.top5ChurnRate ?? null,
    largeRankJumpRate: options.stability?.largeRankJumpRate ?? null,
  };

  const userImpact: RankingV8ValidationUserImpactMetrics = {
    ctrDelta: options.userImpact?.ctrDelta ?? null,
    saveRateDelta: options.userImpact?.saveRateDelta ?? null,
    contactRateDelta: options.userImpact?.contactRateDelta ?? null,
    leadRateDelta: options.userImpact?.leadRateDelta ?? null,
    bookingRateDelta: options.userImpact?.bookingRateDelta ?? null,
  };

  const safety: RankingV8ValidationSafetyMetrics = {
    influenceSkipRate: options.safety?.influenceSkipRate ?? null,
    shadowErrorRate: options.safety?.shadowErrorRate ?? null,
    asyncFailureRate: options.safety?.asyncFailureRate ?? null,
    rankingCrashCount: options.safety?.rankingCrashCount ?? null,
    malformedObservationRate: options.safety?.malformedObservationRate ?? null,
  };

  const coverage: RankingV8ValidationCoverageMetrics = {
    highTrafficQueriesRepresented: options.coverage?.highTrafficQueriesRepresented ?? null,
    lowTrafficQueriesRepresented: options.coverage?.lowTrafficQueriesRepresented ?? null,
    denseInventoryRepresented: options.coverage?.denseInventoryRepresented ?? null,
    sparseInventoryRepresented: options.coverage?.sparseInventoryRepresented ?? null,
    cityZoneDiversityRepresented: options.coverage?.cityZoneDiversityRepresented ?? null,
    priceRangeDiversityRepresented: options.coverage?.priceRangeDiversityRepresented ?? null,
  };

  return {
    quality: q,
    stability,
    userImpact,
    safety,
    coverage,
    meta: options.meta ? { ...options.meta } : undefined,
  };
}
