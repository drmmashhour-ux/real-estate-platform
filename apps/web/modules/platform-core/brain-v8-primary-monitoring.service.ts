/**
 * Process-local observability for Brain V8 Phase D primary routing (monitoring only).
 * Post-cutover KPIs are observational — they do not change routing or learning.
 */
import { logInfo, logWarn } from "@/lib/logger";
import type { BrainSnapshotPayload } from "./brain-snapshot.service";
import { getLastBrainV8ComparisonReport } from "./brain-v8-shadow-comparison.service";

let v8PrimarySuccessCount = 0;
let v8PrimaryFallbackCount = 0;
const recentPrimaryFallbackReasons: string[] = [];
const MAX_REASONS = 12;

let lastPrimaryPathLabel: "brain_v8_primary" | "brain_v8_primary_fallback_current" | null = null;

/** Exact-code fallback tallies (additive KPI). */
const reasonBreakdown: Record<string, number> = {};
/** Coarse buckets for dashboards. */
const categoryBreakdown: Record<string, number> = {};

const recentRunIsFallback: boolean[] = [];
const MAX_RECENT_RUNS = 80;

const lastSuccessMeanAbsScores: number[] = [];
const MAX_SCORE_SAMPLES = 24;

let totalRunsLogged = 0;

const NS_POST = "[brain:v8:post-cutover]";

const FALLBACK_WARN_MODERATE = 0.05;
const FALLBACK_WARN_HIGH = 0.1;
const MIN_RUNS_FOR_RATE_WARN = 8;
const LEGACY_FREQUENT_FALLBACK = 0.45;

export function resetBrainV8PrimaryMonitoringForTests(): void {
  v8PrimarySuccessCount = 0;
  v8PrimaryFallbackCount = 0;
  recentPrimaryFallbackReasons.length = 0;
  lastPrimaryPathLabel = null;
  for (const k of Object.keys(reasonBreakdown)) delete reasonBreakdown[k];
  for (const k of Object.keys(categoryBreakdown)) delete categoryBreakdown[k];
  recentRunIsFallback.length = 0;
  lastSuccessMeanAbsScores.length = 0;
  totalRunsLogged = 0;
}

export type BrainV8PostCutoverSupplement = {
  totalRuns: number;
  fallbackRatePct: number;
  reasonBreakdown: Record<string, number>;
  categoryBreakdown: Record<string, number>;
  observationalWarnings: string[];
  /** 0–100 heuristic; higher suggests a healthier primary path (not ground truth). */
  stabilityScoreHeuristic: number;
  avgMeanOutcomeScoreLastN: number | null;
  outcomeScoreVolatilityHint: "low" | "moderate" | "high" | "insufficient_sample";
  /** Last Phase B comparison snapshot if available (same process). */
  phaseBComparison: { overlapRate: number; divergenceRate: number; observedAt: string } | null;
  /** Rolling: fraction of fallbacks in last 10 runs vs previous 10 (null if not enough data). */
  fallbackSpikeHint: "none" | "possible_spike" | "insufficient_data";
};

export type BrainV8PrimaryMonitoringSnapshot = {
  v8PrimarySuccessCount: number;
  v8PrimaryFallbackCount: number;
  recentPrimaryFallbackReasons: string[];
  lastPrimaryPathLabel: "brain_v8_primary" | "brain_v8_primary_fallback_current" | null;
  /** Post-cutover KPIs (optional block for older callers). */
  postCutover?: BrainV8PostCutoverSupplement;
};

export function categorizeBrainV8FallbackReason(reason: string): string {
  if (reason === "v8_primary_throw") return "exception";
  if (reason === "weak_comparison_quality") return "comparison_gate";
  if (
    reason === "invalid_snapshot_outcomes" ||
    reason === "empty_shadow_unexpected" ||
    reason === "non_finite_shadow_aggregate"
  ) {
    return "readiness";
  }
  if (
    reason === "candidate_outcomes_invalid" ||
    reason === "outcome_count_mismatch" ||
    reason === "decision_id_set_mismatch" ||
    reason === "non_finite_outcome_score"
  ) {
    return "validation";
  }
  return "other";
}

function bump(map: Record<string, number>, key: string): void {
  map[key] = (map[key] ?? 0) + 1;
}

function pushRecentRun(isFallback: boolean): void {
  recentRunIsFallback.push(isFallback);
  if (recentRunIsFallback.length > MAX_RECENT_RUNS) recentRunIsFallback.splice(0, recentRunIsFallback.length - MAX_RECENT_RUNS);
}

function fallbackSpikeDetect(): BrainV8PostCutoverSupplement["fallbackSpikeHint"] {
  if (recentRunIsFallback.length < 20) return "insufficient_data";
  const last10 = recentRunIsFallback.slice(-10);
  const prev10 = recentRunIsFallback.slice(-20, -10);
  const rLast = last10.filter(Boolean).length / 10;
  const rPrev = prev10.filter(Boolean).length / 10;
  if (rLast - rPrev >= 0.25 && rLast >= 0.3) return "possible_spike";
  return "none";
}

function buildObservationalWarnings(
  total: number,
  fbRate: number,
  volatility: BrainV8PostCutoverSupplement["outcomeScoreVolatilityHint"],
  phaseB: BrainV8PostCutoverSupplement["phaseBComparison"],
  spike: BrainV8PostCutoverSupplement["fallbackSpikeHint"],
): string[] {
  const w: string[] = [];
  if (total >= MIN_RUNS_FOR_RATE_WARN && fbRate >= FALLBACK_WARN_HIGH) {
    w.push(`Heuristic: fallback rate ${(fbRate * 100).toFixed(1)}% meets/exceeds high threshold (${FALLBACK_WARN_HIGH * 100}%).`);
  } else if (total >= MIN_RUNS_FOR_RATE_WARN && fbRate >= FALLBACK_WARN_MODERATE) {
    w.push(`Heuristic: fallback rate ${(fbRate * 100).toFixed(1)}% meets/exceeds moderate threshold (${FALLBACK_WARN_MODERATE * 100}%).`);
  }
  if (spike === "possible_spike") w.push("Heuristic: possible sudden increase in fallbacks in the last 10 runs vs prior 10.");
  if (volatility === "high") w.push("Heuristic: outcome score dispersion in recent primary successes is high — review data quality.");
  if (phaseB && phaseB.divergenceRate >= 0.55) {
    w.push("Heuristic: last Phase B comparison shows high divergence vs current Brain — verify comparison sample quality.");
  }
  if (phaseB && phaseB.overlapRate < 0.35 && phaseB.divergenceRate >= 0) {
    w.push("Heuristic: last Phase B comparison shows low overlap — pairing/coverage may be thin.");
  }
  return w;
}

function computeStabilityScore(fbRate: number, volatility: BrainV8PostCutoverSupplement["outcomeScoreVolatilityHint"], phaseB: BrainV8PostCutoverSupplement["phaseBComparison"]): number {
  let s = 100 * (1 - Math.min(1, fbRate * 4));
  if (volatility === "high") s -= 12;
  if (volatility === "moderate") s -= 5;
  if (phaseB) s -= Math.min(25, phaseB.divergenceRate * 35);
  return Math.max(0, Math.min(100, Math.round(s)));
}

function volatilityHint(): BrainV8PostCutoverSupplement["outcomeScoreVolatilityHint"] {
  if (lastSuccessMeanAbsScores.length < 4) return "insufficient_sample";
  const mean = lastSuccessMeanAbsScores.reduce((a, b) => a + b, 0) / lastSuccessMeanAbsScores.length;
  const variance =
    lastSuccessMeanAbsScores.map((x) => (x - mean) ** 2).reduce((a, b) => a + b, 0) / lastSuccessMeanAbsScores.length;
  const std = Math.sqrt(variance);
  if (std > 0.22) return "high";
  if (std > 0.12) return "moderate";
  return "low";
}

function buildPostCutoverSupplement(): BrainV8PostCutoverSupplement {
  const total = v8PrimarySuccessCount + v8PrimaryFallbackCount;
  const fbRate = total > 0 ? v8PrimaryFallbackCount / total : 0;
  const vol = volatilityHint();
  let phaseB: BrainV8PostCutoverSupplement["phaseBComparison"] = null;
  try {
    const rep = getLastBrainV8ComparisonReport();
    if (rep) {
      phaseB = {
        overlapRate: rep.metrics.overlapRate,
        divergenceRate: rep.metrics.divergenceRate,
        observedAt: rep.observedAt,
      };
    }
  } catch {
    /* optional Phase B */
  }
  const spike = fallbackSpikeDetect();
  const warnings = buildObservationalWarnings(total, fbRate, vol, phaseB, spike);
  const avgMean =
    lastSuccessMeanAbsScores.length > 0 ?
      Number(
        (
          lastSuccessMeanAbsScores.reduce((a, b) => a + b, 0) / lastSuccessMeanAbsScores.length
        ).toFixed(6),
      )
    : null;

  return {
    totalRuns: total,
    fallbackRatePct: Number((fbRate * 100).toFixed(2)),
    reasonBreakdown: { ...reasonBreakdown },
    categoryBreakdown: { ...categoryBreakdown },
    observationalWarnings: warnings,
    stabilityScoreHeuristic: computeStabilityScore(fbRate, vol, phaseB),
    avgMeanOutcomeScoreLastN: avgMean,
    outcomeScoreVolatilityHint: vol,
    phaseBComparison: phaseB,
    fallbackSpikeHint: spike,
  };
}

export function getBrainV8PrimaryMonitoringSnapshot(): BrainV8PrimaryMonitoringSnapshot {
  return {
    v8PrimarySuccessCount,
    v8PrimaryFallbackCount,
    recentPrimaryFallbackReasons: [...recentPrimaryFallbackReasons],
    lastPrimaryPathLabel,
    postCutover: buildPostCutoverSupplement(),
  };
}

export function recordBrainV8PrimaryOutcome(outcome: "success" | "fallback", reason?: string): void {
  if (outcome === "success") {
    v8PrimarySuccessCount++;
    bump(reasonBreakdown, "_primary_success");
    bump(categoryBreakdown, "success");
    pushRecentRun(false);
  } else {
    v8PrimaryFallbackCount++;
    const r = reason ?? "unknown_fallback";
    bump(reasonBreakdown, r);
    bump(categoryBreakdown, categorizeBrainV8FallbackReason(r));
    if (recentPrimaryFallbackReasons.length < MAX_REASONS) {
      recentPrimaryFallbackReasons.push(r);
    }
    pushRecentRun(true);
  }
  totalRunsLogged += 1;
  if (totalRunsLogged % 25 === 0) {
    const pc = buildPostCutoverSupplement();
    logInfo(NS_POST, "rollup_tick", {
      totalRuns: pc.totalRuns,
      fallbackRatePct: pc.fallbackRatePct,
      stabilityScoreHeuristic: pc.stabilityScoreHeuristic,
      topFallbackCategories: Object.entries(pc.categoryBreakdown)
        .filter(([k]) => k !== "success")
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5),
    });
  }
}

/**
 * Success-path shape metrics only — does not validate (validation stays in routing).
 */
export function recordBrainV8PrimarySuccessOutputShape(base: BrainSnapshotPayload, candidate: { recentOutcomes: BrainSnapshotPayload["recentOutcomes"] }): void {
  const n = candidate.recentOutcomes.length;
  if (n === 0) return;
  let sumAbs = 0;
  let bad = 0;
  for (const o of candidate.recentOutcomes) {
    const x = o.outcomeScore;
    if (typeof x !== "number" || !Number.isFinite(x)) bad += 1;
    else sumAbs += Math.abs(x);
  }
  const meanAbs = sumAbs / n;
  lastSuccessMeanAbsScores.push(meanAbs);
  if (lastSuccessMeanAbsScores.length > MAX_SCORE_SAMPLES) lastSuccessMeanAbsScores.splice(0, lastSuccessMeanAbsScores.length - MAX_SCORE_SAMPLES);
  if (bad > 0) {
    logWarn(NS_POST, "unexpected_non_finite_in_success_metrics", { bad, n, note: "routing should have blocked — observational only" });
  }
  if (n > 48 || n < 1) {
    logWarn(NS_POST, "unusual_outcome_count_observed", { n, baseline: base.recentOutcomes.length });
  }
}

export function recordBrainV8PrimaryPathLog(path: "brain_v8_primary" | "brain_v8_primary_fallback_current"): void {
  lastPrimaryPathLabel = path;
}

function warnIfFrequentPrimaryFallback(ns: string): void {
  const total = v8PrimarySuccessCount + v8PrimaryFallbackCount;
  if (total >= 5 && v8PrimaryFallbackCount / total > LEGACY_FREQUENT_FALLBACK) {
    logWarn(ns, "brain_v8_primary_frequent_fallback_observed", {
      success: v8PrimarySuccessCount,
      fallback: v8PrimaryFallbackCount,
      recentReasons: recentPrimaryFallbackReasons,
    });
  }
  postCutoverThresholdWarnings();
}

function postCutoverThresholdWarnings(): void {
  const total = v8PrimarySuccessCount + v8PrimaryFallbackCount;
  if (total < MIN_RUNS_FOR_RATE_WARN) return;
  const rate = v8PrimaryFallbackCount / total;
  if (rate >= FALLBACK_WARN_HIGH) {
    logWarn(NS_POST, "fallback_rate_high_observed", {
      ratePct: Number((rate * 100).toFixed(2)),
      thresholdPct: FALLBACK_WARN_HIGH * 100,
      success: v8PrimarySuccessCount,
      fallback: v8PrimaryFallbackCount,
    });
  } else if (rate >= FALLBACK_WARN_MODERATE && total % 12 === 0) {
    logWarn(NS_POST, "fallback_rate_moderate_observed", {
      ratePct: Number((rate * 100).toFixed(2)),
      thresholdPct: FALLBACK_WARN_MODERATE * 100,
      note: "sampled to reduce log noise",
    });
  }
  const spike = fallbackSpikeDetect();
  if (spike === "possible_spike") {
    logWarn(NS_POST, "fallback_spike_suspected", { hint: recentRunIsFallback.slice(-20) });
  }
}

export { warnIfFrequentPrimaryFallback };
