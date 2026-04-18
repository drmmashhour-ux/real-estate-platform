/**
 * Advisory rollout mapping from scorecard + flags — does not toggle production.
 */
import type { RankingV8ComparisonResult } from "./ranking-v8-comparison.types";
import type { RankingV8ValidationScorecard } from "./ranking-v8-validation-scoring.types";
import type {
  RankingV8GovernancePayload,
  RankingV8GovernanceReadiness,
  RankingV8GovernanceRecommendation,
} from "./ranking-v8-governance.types";

export type RankingV8GovernanceFlagsSlice = {
  rankingV8ShadowEvaluatorV1: boolean;
  rankingV8InfluenceV1: boolean;
  rankingV8ValidationScoringV1: boolean;
};

export function deriveCurrentPhase(flags: RankingV8GovernanceFlagsSlice): string {
  if (!flags.rankingV8ShadowEvaluatorV1) return "shadow_off";
  if (flags.rankingV8InfluenceV1) return "phase_c_influence";
  return "shadow_only";
}

export function deriveRolloutRecommendation(input: {
  scorecard: RankingV8ValidationScorecard;
  flags: RankingV8GovernanceFlagsSlice;
  comparison: RankingV8ComparisonResult | null;
  combinedWarnings: string[];
}): {
  recommendation: RankingV8GovernanceRecommendation;
  targetPhase: string | null;
  readiness: RankingV8GovernanceReadiness;
  blockingReasons: string[];
  warnings: string[];
} {
  const { scorecard, flags, comparison, combinedWarnings } = input;
  const w = [...combinedWarnings, ...scorecard.warnings];

  if (w.some((x) => x.includes("rollback_signal"))) {
    return {
      recommendation: "rollback_recommended",
      targetPhase: "shadow_only",
      readiness: buildReadiness(scorecard, true),
      blockingReasons: w.filter((x) => x.includes("rollback_signal") || x.includes("rollback")),
      warnings: w,
    };
  }

  const d = scorecard.decision;
  let recommendation: RankingV8GovernanceRecommendation = "stay_in_shadow";
  let targetPhase: string | null = null;

  if (d === "not_ready") {
    recommendation = "stay_in_shadow";
    targetPhase = "shadow_only";
  } else if (d === "phase_c_only") {
    recommendation = "phase_c_only";
    targetPhase = "phase_c_influence";
  } else if (d === "strong") {
    recommendation = "expand_phase_c";
    targetPhase = "phase_c_influence";
  } else if (d === "production_ready") {
    recommendation = "candidate_for_primary";
    targetPhase = "primary_candidate_review";
  }

  if (comparison?.qualitySignals.orderingInstabilityHint && d !== "not_ready") {
    w.push("advisory: instability_hint_present_review_before_expand");
  }

  const blockingReasons: string[] = [];
  if (scorecard.categoryScores.quality.score < 2.5) blockingReasons.push("quality_below_gate");
  if (scorecard.categoryScores.stability.score < 2.5) blockingReasons.push("stability_below_gate");
  if (scorecard.categoryScores.safety.score < 3) blockingReasons.push("safety_below_gate");
  if (scorecard.categoryScores.coverage.score < 2.5) blockingReasons.push("coverage_below_gate");

  return {
    recommendation,
    targetPhase,
    readiness: buildReadiness(scorecard, false),
    blockingReasons,
    warnings: [...new Set([...w])],
  };
}

function buildReadiness(scorecard: RankingV8ValidationScorecard, forceFail: boolean): RankingV8GovernanceReadiness {
  const q = scorecard.categoryScores.quality.score;
  const s = scorecard.categoryScores.stability.score;
  const f = scorecard.categoryScores.safety.score;
  const c = scorecard.categoryScores.coverage.score;
  const u = scorecard.categoryScores.userImpact.score;
  const note = scorecard.notes.some((n) => n.includes("unavailable"));
  return {
    qualityReady: !forceFail && q >= 3,
    stabilityReady: !forceFail && s >= 3,
    safetyReady: !forceFail && f >= 3.5,
    coverageReady: !forceFail && c >= 3,
    userImpactReady: !forceFail && u >= 2.5 && !note,
    userImpactNa: note,
  };
}

export function buildRollbackSignals(input: {
  comparison: RankingV8ComparisonResult | null;
  scorecard: RankingV8ValidationScorecard;
  metrics: RankingV8GovernancePayload["metrics"];
  /** Elevated malformed shadow row rate (0–1) — observational proxy for pipeline health. */
  malformedObservationRate?: number | null;
}): RankingV8GovernancePayload["rollbackSignals"] {
  const t5 = input.metrics.top5Overlap;
  const severeOverlap = t5 != null && t5 < 0.5;
  const instability =
    input.comparison?.qualitySignals.orderingInstabilityHint === true ||
    (input.comparison?.summary.stabilityScore != null && input.comparison.summary.stabilityScore < 0.4);
  const neg =
    [input.metrics.ctrDelta, input.metrics.saveDelta, input.metrics.leadDelta].some(
      (x) => x != null && x < -0.02,
    );
  const mal = input.malformedObservationRate;
  const errors = mal != null && mal > 0.25;
  return {
    severeOverlapDrop: severeOverlap,
    instabilitySpike: instability,
    errorPresent: errors,
    negativeUserImpact: neg,
  };
}
