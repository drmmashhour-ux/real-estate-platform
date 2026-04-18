/**
 * Ranking V8 validation scorecard — read-only; does not affect live ranking or rollout flags.
 */
import { logInfo } from "@/lib/logger";
import {
  RANKING_V8_STAB_CHURN_ACCEPTABLE,
  RANKING_V8_STAB_CHURN_STRONG,
  RANKING_V8_STAB_JUMP_ACCEPTABLE,
  RANKING_V8_STAB_JUMP_STRONG,
  RANKING_V8_STAB_REPEAT_ACCEPTABLE,
  RANKING_V8_STAB_REPEAT_STRONG,
  RANKING_V8_VALIDATION_MAX_PER_CATEGORY,
  RANKING_V8_VALIDATION_MAX_TOTAL,
  RANKING_V8_WARN_AVG_RANK_SHIFT,
  RANKING_V8_WARN_CHURN,
  RANKING_V8_WARN_CONV_DROP,
  RANKING_V8_WARN_CTR_DROP,
  RANKING_V8_WARN_LARGE_JUMP,
  RANKING_V8_WARN_STABILITY_SPIKE,
  RANKING_V8_WARN_TOP10_OVERLAP,
  RANKING_V8_WARN_TOP5_OVERLAP,
  RANKING_V8_QUALITY_IMPROVE_ACCEPTABLE,
  RANKING_V8_QUALITY_IMPROVE_STRONG,
  RANKING_V8_QUALITY_SHIFT_ACCEPTABLE,
  RANKING_V8_QUALITY_SHIFT_STRONG,
  RANKING_V8_QUALITY_TOP10_ACCEPTABLE,
  RANKING_V8_QUALITY_TOP10_STRONG,
  RANKING_V8_QUALITY_TOP5_ACCEPTABLE,
  RANKING_V8_QUALITY_TOP5_STRONG,
} from "./ranking-v8-validation-scoring.constants";
import type {
  RankingV8ValidationCategoryScore,
  RankingV8ValidationDecision,
  RankingV8ValidationInputs,
  RankingV8ValidationScorecard,
  RankingV8ValidationWeeklyReport,
} from "./ranking-v8-validation-scoring.types";

const NS = "[ranking:v8:scorecard]";

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

function tierPoints(
  subMax: number,
  band: "strong" | "acceptable" | "weak" | "unavailable",
): number {
  const m = subMax;
  switch (band) {
    case "strong":
      return m;
    case "acceptable":
      return m * 0.68;
    case "weak":
      return m * 0.28;
    default:
      return m * 0.45;
  }
}

function scoreQualityOverlapTop5(rate: number | null, subMax: number): { pts: number; band: string } {
  if (rate == null || !Number.isFinite(rate)) return { pts: tierPoints(subMax, "unavailable"), band: "unavailable" };
  const r = clamp01(rate);
  if (r >= RANKING_V8_QUALITY_TOP5_STRONG) return { pts: tierPoints(subMax, "strong"), band: "strong" };
  if (r >= RANKING_V8_QUALITY_TOP5_ACCEPTABLE) return { pts: tierPoints(subMax, "acceptable"), band: "acceptable" };
  return { pts: tierPoints(subMax, "weak"), band: "weak" };
}

function scoreQualityOverlapTop10(rate: number | null, subMax: number): { pts: number; band: string } {
  if (rate == null || !Number.isFinite(rate)) return { pts: tierPoints(subMax, "unavailable"), band: "unavailable" };
  const r = clamp01(rate);
  if (r >= RANKING_V8_QUALITY_TOP10_STRONG) return { pts: tierPoints(subMax, "strong"), band: "strong" };
  if (r >= RANKING_V8_QUALITY_TOP10_ACCEPTABLE) return { pts: tierPoints(subMax, "acceptable"), band: "acceptable" };
  return { pts: tierPoints(subMax, "weak"), band: "weak" };
}

function scoreQualityShift(shift: number | null, subMax: number): { pts: number; band: string } {
  if (shift == null || !Number.isFinite(shift)) return { pts: tierPoints(subMax, "unavailable"), band: "unavailable" };
  const s = Math.abs(shift);
  if (s <= RANKING_V8_QUALITY_SHIFT_STRONG) return { pts: tierPoints(subMax, "strong"), band: "strong" };
  if (s <= RANKING_V8_QUALITY_SHIFT_ACCEPTABLE) return { pts: tierPoints(subMax, "acceptable"), band: "acceptable" };
  return { pts: tierPoints(subMax, "weak"), band: "weak" };
}

function scoreQualityImprove(rate: number | null, subMax: number): { pts: number; band: string } {
  if (rate == null || !Number.isFinite(rate)) return { pts: tierPoints(subMax, "unavailable"), band: "unavailable" };
  const r = clamp01(rate);
  if (r >= RANKING_V8_QUALITY_IMPROVE_STRONG) return { pts: tierPoints(subMax, "strong"), band: "strong" };
  if (r >= RANKING_V8_QUALITY_IMPROVE_ACCEPTABLE) return { pts: tierPoints(subMax, "acceptable"), band: "acceptable" };
  return { pts: tierPoints(subMax, "weak"), band: "weak" };
}

function computeQualityCategory(q: RankingV8ValidationInputs["quality"]): RankingV8ValidationCategoryScore {
  const w = RANKING_V8_VALIDATION_MAX_PER_CATEGORY / 4;
  const a = scoreQualityOverlapTop5(q.top5OverlapRate, w);
  const b = scoreQualityOverlapTop10(q.top10OverlapRate, w);
  const c = scoreQualityShift(q.avgRankShift, w);
  const d = scoreQualityImprove(q.meaningfulImprovementRate, w);
  const score = Number((a.pts + b.pts + c.pts + d.pts).toFixed(4));
  const band: RankingV8ValidationCategoryScore["band"] =
    score >= 4.2 ? "strong" : score >= 2.8 ? "acceptable" : "weak";
  return {
    score,
    maxScore: RANKING_V8_VALIDATION_MAX_PER_CATEGORY,
    band,
    detail: `top5=${a.band} top10=${b.band} shift=${c.band} improve=${d.band}`,
  };
}

function computeStabilityCategory(s: RankingV8ValidationInputs["stability"]): RankingV8ValidationCategoryScore {
  const w = RANKING_V8_VALIDATION_MAX_PER_CATEGORY / 3;

  function repeat(v: number | null): { pts: number; band: string } {
    if (v == null || !Number.isFinite(v)) return { pts: tierPoints(w, "unavailable"), band: "unavailable" };
    const x = clamp01(v);
    if (x >= RANKING_V8_STAB_REPEAT_STRONG) return { pts: tierPoints(w, "strong"), band: "strong" };
    if (x >= RANKING_V8_STAB_REPEAT_ACCEPTABLE) return { pts: tierPoints(w, "acceptable"), band: "acceptable" };
    return { pts: tierPoints(w, "weak"), band: "weak" };
  }
  function churn(v: number | null): { pts: number; band: string } {
    if (v == null || !Number.isFinite(v)) return { pts: tierPoints(w, "unavailable"), band: "unavailable" };
    const x = clamp01(v);
    if (x <= RANKING_V8_STAB_CHURN_STRONG) return { pts: tierPoints(w, "strong"), band: "strong" };
    if (x <= RANKING_V8_STAB_CHURN_ACCEPTABLE) return { pts: tierPoints(w, "acceptable"), band: "acceptable" };
    return { pts: tierPoints(w, "weak"), band: "weak" };
  }
  function jump(v: number | null): { pts: number; band: string } {
    if (v == null || !Number.isFinite(v)) return { pts: tierPoints(w, "unavailable"), band: "unavailable" };
    const x = clamp01(v);
    if (x < RANKING_V8_STAB_JUMP_STRONG) return { pts: tierPoints(w, "strong"), band: "strong" };
    if (x < RANKING_V8_STAB_JUMP_ACCEPTABLE) return { pts: tierPoints(w, "acceptable"), band: "acceptable" };
    return { pts: tierPoints(w, "weak"), band: "weak" };
  }

  const r = repeat(s.repeatQueryConsistency);
  const ch = churn(s.top5ChurnRate);
  const j = jump(s.largeRankJumpRate);
  const score = Number((r.pts + ch.pts + j.pts).toFixed(4));
  const band: RankingV8ValidationCategoryScore["band"] =
    score >= 4 ? "strong" : score >= 2.5 ? "acceptable" : "weak";
  return {
    score,
    maxScore: RANKING_V8_VALIDATION_MAX_PER_CATEGORY,
    band,
    detail: `repeat=${r.band} churn=${ch.band} jump=${j.band}`,
  };
}

function scoreUserImpactDelta(delta: number | null, one: number): number {
  if (delta == null || !Number.isFinite(delta)) return one * 0.42;
  if (delta >= 0.01) return one;
  if (delta >= 0) return one * 0.78;
  if (delta >= -0.02) return one * 0.52;
  return one * 0.22;
}

function computeUserImpactCategory(u: RankingV8ValidationInputs["userImpact"]): RankingV8ValidationCategoryScore {
  const one = RANKING_V8_VALIDATION_MAX_PER_CATEGORY / 5;
  const pts =
    scoreUserImpactDelta(u.ctrDelta, one) +
    scoreUserImpactDelta(u.saveRateDelta, one) +
    scoreUserImpactDelta(u.contactRateDelta, one) +
    scoreUserImpactDelta(u.leadRateDelta, one) +
    scoreUserImpactDelta(u.bookingRateDelta, one);
  const score = Number(Math.min(RANKING_V8_VALIDATION_MAX_PER_CATEGORY, pts).toFixed(4));
  const band: RankingV8ValidationCategoryScore["band"] =
    score >= 4 ? "strong" : score >= 2.8 ? "acceptable" : "weak";
  return {
    score,
    maxScore: RANKING_V8_VALIDATION_MAX_PER_CATEGORY,
    band,
    detail: "deltas_partial_if_null",
  };
}

function computeSafetyCategory(s: RankingV8ValidationInputs["safety"]): RankingV8ValidationCategoryScore {
  const one = RANKING_V8_VALIDATION_MAX_PER_CATEGORY / 5;
  function errRate(v: number | null): number {
    if (v == null || !Number.isFinite(v)) return one * 0.45;
    if (v <= 0) return one;
    if (v <= 0.02) return one * 0.62;
    if (v <= 0.08) return one * 0.35;
    return one * 0.12;
  }
  function crashes(v: number | null): number {
    if (v == null || !Number.isFinite(v)) return one * 0.45;
    if (v <= 0) return one;
    return 0;
  }
  function skip(v: number | null): number {
    if (v == null || !Number.isFinite(v)) return one * 0.5;
    if (v >= 0.05 && v <= 0.45) return one;
    if (v < 0.05) return one * 0.72;
    return one * 0.55;
  }
  const pts =
    errRate(s.shadowErrorRate) +
    errRate(s.asyncFailureRate) +
    crashes(s.rankingCrashCount) +
    errRate(s.malformedObservationRate) +
    skip(s.influenceSkipRate);
  const score = Number(Math.min(RANKING_V8_VALIDATION_MAX_PER_CATEGORY, pts).toFixed(4));
  const band: RankingV8ValidationCategoryScore["band"] =
    score >= 4.2 ? "strong" : score >= 2.8 ? "acceptable" : "weak";
  return {
    score,
    maxScore: RANKING_V8_VALIDATION_MAX_PER_CATEGORY,
    band,
    detail: "errors_crashes_malformed_skip",
  };
}

function computeCoverageCategory(c: RankingV8ValidationInputs["coverage"]): RankingV8ValidationCategoryScore {
  const dims = [
    c.highTrafficQueriesRepresented,
    c.lowTrafficQueriesRepresented,
    c.denseInventoryRepresented,
    c.sparseInventoryRepresented,
    c.cityZoneDiversityRepresented,
    c.priceRangeDiversityRepresented,
  ];
  let present = 0;
  let unknown = 0;
  for (const d of dims) {
    if (d === true) present += 1;
    else if (d === null) unknown += 1;
  }
  const denom = dims.length;
  const numScore = Number(
    (((present + unknown * 0.35) / denom) * RANKING_V8_VALIDATION_MAX_PER_CATEGORY).toFixed(4),
  );
  const band: RankingV8ValidationCategoryScore["band"] =
    present >= 5 ? "strong" : present >= 3 ? "acceptable" : "weak";
  return {
    score: numScore,
    maxScore: RANKING_V8_VALIDATION_MAX_PER_CATEGORY,
    band,
    detail: `dimensions_ok=${present}/${denom}_unknown=${unknown}`,
  };
}

function mapDecision(total: number): RankingV8ValidationDecision {
  if (total <= 12) return "not_ready";
  if (total <= 18) return "phase_c_only";
  if (total <= 22) return "strong";
  return "production_ready";
}

function collectWarningsAndNotes(
  input: RankingV8ValidationInputs,
  categories: RankingV8ValidationScorecard["categoryScores"],
): { warnings: string[]; notes: string[] } {
  const warnings: string[] = [];
  const notes: string[] = [];

  const t5 = input.quality.top5OverlapRate;
  if (t5 != null && t5 < RANKING_V8_WARN_TOP5_OVERLAP) {
    warnings.push(`rollback_signal: top5_overlap_below_${RANKING_V8_WARN_TOP5_OVERLAP}`);
  }

  const t10 = input.quality.top10OverlapRate;
  if (t10 != null && t10 < RANKING_V8_WARN_TOP10_OVERLAP) {
    warnings.push(`observation: top10_overlap_low_below_${RANKING_V8_WARN_TOP10_OVERLAP}`);
  }

  const ars = input.quality.avgRankShift;
  if (ars != null && Number.isFinite(ars) && Math.abs(ars) > RANKING_V8_WARN_AVG_RANK_SHIFT) {
    warnings.push(`observation: excessive_avg_rank_shift_above_${RANKING_V8_WARN_AVG_RANK_SHIFT}`);
  }

  const churn = input.stability.top5ChurnRate;
  if (churn != null && Number.isFinite(churn) && churn > RANKING_V8_WARN_CHURN) {
    warnings.push(`observation: high_top5_churn_above_${RANKING_V8_WARN_CHURN}`);
  }

  const jmp = input.stability.largeRankJumpRate;
  if (jmp != null && Number.isFinite(jmp) && jmp >= RANKING_V8_WARN_LARGE_JUMP) {
    warnings.push(`observation: high_large_rank_jump_rate_at_or_above_${RANKING_V8_WARN_LARGE_JUMP}`);
  }

  const ctr = input.userImpact.ctrDelta;
  if (ctr != null && ctr < RANKING_V8_WARN_CTR_DROP) {
    warnings.push("rollback_signal: ctr_delta_negative_material");
  }

  const lead = input.userImpact.leadRateDelta ?? input.userImpact.contactRateDelta;
  if (lead != null && lead < RANKING_V8_WARN_CONV_DROP) {
    warnings.push("rollback_signal: conversion_proxy_negative");
  }

  if (
    input.stability.repeatQueryConsistency != null &&
    input.stability.repeatQueryConsistency < RANKING_V8_WARN_STABILITY_SPIKE
  ) {
    warnings.push("rollback_signal: repeat_query_consistency_low");
  }

  if (input.safety.rankingCrashCount != null && input.safety.rankingCrashCount > 0) {
    warnings.push("rollback_signal: non_zero_ranking_crashes");
  }
  if (input.safety.shadowErrorRate != null && input.safety.shadowErrorRate > 0.05) {
    warnings.push("rollback_signal: elevated_shadow_error_rate");
  }

  if (categories.coverage.band === "weak") {
    warnings.push("coverage_weak: expand_inventory_and_query_diversity");
  }

  if (categories.userImpact.band === "weak" && categories.quality.band === "strong") {
    notes.push("quality_strong_but_user_impact_weak_verify_experiment_window");
  }

  const unavailableUser =
    [
      input.userImpact.ctrDelta,
      input.userImpact.saveRateDelta,
      input.userImpact.contactRateDelta,
      input.userImpact.leadRateDelta,
      input.userImpact.bookingRateDelta,
    ].filter((x) => x == null).length >= 3;
  if (unavailableUser) {
    notes.push("user_impact_metrics_mostly_unavailable_scores_degraded_neutral");
    warnings.push("observation: many_user_impact_metrics_unavailable");
  }

  const negSave = input.userImpact.saveRateDelta;
  if (negSave != null && negSave < RANKING_V8_WARN_CTR_DROP) {
    warnings.push("observation: save_rate_delta_negative_material");
  }

  const negBook = input.userImpact.bookingRateDelta;
  if (negBook != null && negBook < RANKING_V8_WARN_CONV_DROP) {
    warnings.push("observation: booking_rate_delta_negative_material");
  }

  if (input.safety.asyncFailureRate != null && input.safety.asyncFailureRate > 0.05) {
    warnings.push("observation: elevated_async_failure_rate");
  }

  if (input.safety.malformedObservationRate != null && input.safety.malformedObservationRate > 0.15) {
    warnings.push("observation: elevated_malformed_observation_rate");
  }

  return { warnings, notes };
}

function cloneInputs(input: RankingV8ValidationInputs): RankingV8ValidationInputs {
  return {
    quality: { ...input.quality },
    stability: { ...input.stability },
    userImpact: { ...input.userImpact },
    safety: { ...input.safety },
    coverage: { ...input.coverage },
    meta: input.meta ? { ...input.meta } : undefined,
  };
}

/**
 * Pure scorecard builder — safe for tests; does not read feature flags.
 */
export function buildRankingV8ValidationScorecard(input: RankingV8ValidationInputs): RankingV8ValidationScorecard {
  const rawMetrics = cloneInputs(input);
  const quality = computeQualityCategory(input.quality);
  const stability = computeStabilityCategory(input.stability);
  const userImpact = computeUserImpactCategory(input.userImpact);
  const safety = computeSafetyCategory(input.safety);
  const coverage = computeCoverageCategory(input.coverage);

  const categoryScores = { quality, stability, userImpact, safety, coverage };
  const totalScore = Number(
    (
      quality.score +
      stability.score +
      userImpact.score +
      safety.score +
      coverage.score
    ).toFixed(4),
  );
  const decision = mapDecision(totalScore);
  const { warnings, notes } = collectWarningsAndNotes(input, categoryScores);

  return {
    totalScore,
    maxScore: RANKING_V8_VALIDATION_MAX_TOTAL,
    categoryScores,
    rawMetrics,
    decision,
    warnings,
    notes,
  };
}

export function logRankingV8ValidationScorecard(card: RankingV8ValidationScorecard): void {
  const raw = card.rawMetrics;
  const cov = raw.coverage;
  const coverageSummary = [
    cov.highTrafficQueriesRepresented === true ? "hiT" : cov.highTrafficQueriesRepresented == null ? "hi?" : "hi-",
    cov.lowTrafficQueriesRepresented === true ? "loT" : cov.lowTrafficQueriesRepresented == null ? "lo?" : "lo-",
    cov.denseInventoryRepresented === true ? "den" : cov.denseInventoryRepresented == null ? "de?" : "de-",
    cov.sparseInventoryRepresented === true ? "spa" : cov.sparseInventoryRepresented == null ? "sp?" : "sp-",
    cov.cityZoneDiversityRepresented === true ? "cz" : cov.cityZoneDiversityRepresented == null ? "cz?" : "cz-",
    cov.priceRangeDiversityRepresented === true ? "pr" : cov.priceRangeDiversityRepresented == null ? "pr?" : "pr-",
  ].join("|");

  logInfo(NS, {
    event: "scorecard",
    totalScore: card.totalScore,
    maxScore: card.maxScore,
    decision: card.decision,
    quality: card.categoryScores.quality.score,
    stability: card.categoryScores.stability.score,
    userImpact: card.categoryScores.userImpact.score,
    safety: card.categoryScores.safety.score,
    coverage: card.categoryScores.coverage.score,
    warningCount: card.warnings.length,
    top5Overlap: raw.quality.top5OverlapRate,
    top10Overlap: raw.quality.top10OverlapRate,
    avgRankShift: raw.quality.avgRankShift,
    coverageSummary,
  });
}

export function buildRankingV8ValidationWeeklyReport(
  card: RankingV8ValidationScorecard,
  input: RankingV8ValidationInputs,
): RankingV8ValidationWeeklyReport {
  return {
    windowLabel: input.meta?.windowLabel,
    queriesAnalyzed: input.meta?.queriesAnalyzed ?? null,
    listingsEvaluated: input.meta?.listingsEvaluated ?? null,
    top5Overlap: input.quality.top5OverlapRate,
    top10Overlap: input.quality.top10OverlapRate,
    avgRankShift: input.quality.avgRankShift,
    ctrDelta: input.userImpact.ctrDelta,
    saveDelta: input.userImpact.saveRateDelta,
    leadDelta: input.userImpact.leadRateDelta,
    skipRate: input.safety.influenceSkipRate,
    errorRate: input.safety.shadowErrorRate,
    finalScore: card.totalScore,
    decision: card.decision,
    categorySummary: [
      `Q=${card.categoryScores.quality.score.toFixed(1)}`,
      `S=${card.categoryScores.stability.score.toFixed(1)}`,
      `U=${card.categoryScores.userImpact.score.toFixed(1)}`,
      `F=${card.categoryScores.safety.score.toFixed(1)}`,
      `C=${card.categoryScores.coverage.score.toFixed(1)}`,
    ].join(" "),
    warningCount: card.warnings.length,
  };
}
