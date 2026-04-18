/**
 * CRO V8 shadow vs real funnel comparison — read-only validation of analysis heuristics.
 * Does not read/write funnel emitters, checkout, or aggregates beyond inputs passed in.
 */
import { croOptimizationV8Flags } from "@/config/feature-flags";
import { logInfo } from "@/lib/logger";
import { FUNNEL_BENCHMARKS, type FunnelMetrics } from "./funnel-analysis.service";
import type { CroV8DropoffPoint, CroV8ShadowRecommendation } from "./cro-v8-optimization.types";
import type {
  CroV8ComparisonStageId,
  CroV8FunnelComparisonQuality,
  CroV8FunnelComparisonResult,
  CroV8FunnelComparisonSessionRolling,
} from "./cro-v8-funnel-comparison.types";

const NS = "[cro:v8:comparison]";

const STAGE_IDS: CroV8ComparisonStageId[] = [
  "landing_to_cta",
  "cta_to_lead",
  "lead_to_booking_start",
  "booking_start_to_complete",
];

const DROP_ID_TO_REC_HINT: Record<CroV8ComparisonStageId, string> = {
  landing_to_cta: "CTR",
  cta_to_lead: "CLICK_TO_LEAD",
  lead_to_booking_start: "LEAD_TO_BOOKING",
  booking_start_to_complete: "COMPLETION",
};

let sessionRuns = 0;
let sessionAccuracySum = 0;
let sessionFpSum = 0;
let sessionFnSum = 0;
let sessionHighConfCorrect = 0;
let sessionHighConfTotal = 0;
/** stageId -> consecutive mismatches (observational) */
const recentMismatchStreak = new Map<string, number>();

/** Test hook */
export function resetCroV8FunnelComparisonSessionForTests(): void {
  sessionRuns = 0;
  sessionAccuracySum = 0;
  sessionFpSum = 0;
  sessionFnSum = 0;
  sessionHighConfCorrect = 0;
  sessionHighConfTotal = 0;
  recentMismatchStreak.clear();
}

function maxBy<T>(items: T[], score: (t: T) => number): T | null {
  if (!items.length) return null;
  let best = items[0]!;
  let bestS = score(best);
  for (let i = 1; i < items.length; i++) {
    const s = score(items[i]!);
    if (s > bestS) {
      best = items[i]!;
      bestS = s;
    }
  }
  return best;
}

function groundTruthWeakest(dropoffs: CroV8DropoffPoint[]): CroV8ComparisonStageId {
  const m = maxBy(dropoffs, (d) => d.gapVsBenchmark);
  return (m?.id ?? "landing_to_cta") as CroV8ComparisonStageId;
}

/**
 * CRO emphasis: prefer max gap among `priority`; else max among `watch`; else global max.
 * This can diverge from {@link groundTruthWeakest} when priority tiers disagree with raw ranking.
 */
export function pickCroPrimaryStageId(dropoffs: CroV8DropoffPoint[]): CroV8ComparisonStageId | null {
  if (!dropoffs.length) return null;
  const priorities = dropoffs.filter((d) => d.severity === "priority");
  if (priorities.length) {
    return maxBy(priorities, (d) => d.gapVsBenchmark)!.id as CroV8ComparisonStageId;
  }
  const watches = dropoffs.filter((d) => d.severity === "watch");
  if (watches.length) {
    return maxBy(watches, (d) => d.gapVsBenchmark)!.id as CroV8ComparisonStageId;
  }
  return maxBy(dropoffs, (d) => d.gapVsBenchmark)!.id as CroV8ComparisonStageId;
}

function shadowTouchesStage(
  recs: CroV8ShadowRecommendation[],
  stageId: CroV8ComparisonStageId,
  leaksStages: Set<string>,
): boolean {
  const hint = DROP_ID_TO_REC_HINT[stageId];
  for (const r of recs) {
    if (r.id === `shadow_drop_${stageId}`) return true;
    if (r.targetStage === hint) return true;
    if (r.targetStage !== "PORTFOLIO" && r.targetStage === hint) return true;
    if (r.hypothesis.includes(stageId)) return true;
  }
  if (leaksStages.has(hint)) return true;
  return false;
}

/** Count of `priority` severities not on the global max-gap stage (severity vs rank heuristic). */
function misclassifiedHeuristic(dropoffs: CroV8DropoffPoint[]): number {
  if (dropoffs.length === 0) return 0;
  const maxG = Math.max(...dropoffs.map((d) => d.gapVsBenchmark));
  return dropoffs.filter((d) => d.severity === "priority" && d.gapVsBenchmark + 1e-9 < maxG).length;
}

function insufficientDataHeuristic(m: FunnelMetrics): boolean {
  return m.landingViews < 5;
}

function dataCoverageRatio(m: FunnelMetrics): number {
  let ok = 0;
  if (m.landingViews >= 1) ok++;
  if (m.clicks >= 0) ok++;
  if (m.leads >= 0) ok++;
  if (m.bookingStarted >= 0) ok++;
  if (m.bookingCompleted >= 0) ok++;
  return ok / 5;
}

function buildRows(
  metrics: FunnelMetrics,
  dropoffs: CroV8DropoffPoint[],
  shadowRecommendations: CroV8ShadowRecommendation[],
): CroV8FunnelComparisonRow[] {
  const byId = new Map(dropoffs.map((d) => [d.id, d]));
  const rates: Record<CroV8ComparisonStageId, { actual: number; bench: number }> = {
    landing_to_cta: { actual: metrics.ctr, bench: FUNNEL_BENCHMARKS.CTR },
    cta_to_lead: { actual: metrics.clickToLead, bench: FUNNEL_BENCHMARKS.CLICK_TO_LEAD },
    lead_to_booking_start: { actual: metrics.leadToBooking, bench: FUNNEL_BENCHMARKS.LEAD_TO_BOOKING },
    booking_start_to_complete: { actual: metrics.completionRate, bench: FUNNEL_BENCHMARKS.COMPLETION },
  };

  const recLine = (stageId: CroV8ComparisonStageId): string | undefined => {
    const direct = shadowRecommendations.find((r) => r.id === `shadow_drop_${stageId}`);
    if (direct) return direct.title;
    const hint = DROP_ID_TO_REC_HINT[stageId];
    const leakRec = shadowRecommendations.find((r) => r.targetStage === hint);
    return leakRec?.title;
  };

  return STAGE_IDS.map((stage) => {
    const d = byId.get(stage);
    const { actual, bench } = rates[stage];
    const gap = Math.max(0, bench - actual);
    const row: CroV8FunnelComparisonRow = {
      stage,
      actualRate: actual,
      benchmarkRate: bench,
      dropoff: gap,
      expectedDropoff: gap,
      severity: d?.severity ?? "info",
      recommendation: recLine(stage),
    };
    return row;
  });
}

function computeQuality(
  metrics: FunnelMetrics,
  dropoffs: CroV8DropoffPoint[],
  shadowRecommendations: CroV8ShadowRecommendation[],
  leaksStages: Set<string>,
): CroV8FunnelComparisonQuality {
  const gt = groundTruthWeakest(dropoffs);
  const croPrimary = pickCroPrimaryStageId(dropoffs);
  const bottleneckMatch = croPrimary !== null && croPrimary === gt;

  const recommendationAligned =
    shadowRecommendations.length === 0 || shadowTouchesStage(shadowRecommendations, gt, leaksStages);

  const maxGap = dropoffs.length ? Math.max(...dropoffs.map((d) => d.gapVsBenchmark)) : 0;
  const priorities = dropoffs.filter((d) => d.severity === "priority");
  /** Priority placed on a stage that is not the max-gap bottleneck. */
  const falsePositiveEstimate = dropoffs.some(
    (d) => d.severity === "priority" && d.gapVsBenchmark + 1e-9 < maxGap,
  );
  /** Max-gap stage exists but is not `priority` while another stage is — under-emphasis heuristic. */
  const worstRow = dropoffs.find((d) => d.id === gt);
  const falseNegativeEstimate =
    maxGap > 1e-6 &&
    priorities.length > 0 &&
    worstRow !== undefined &&
    worstRow.gapVsBenchmark + 1e-9 >= maxGap &&
    worstRow.severity !== "priority";

  let accuracyScore = 100;
  if (!bottleneckMatch) accuracyScore -= 45;
  if (!recommendationAligned && shadowRecommendations.length > 0) accuracyScore -= 25;
  if (falsePositiveEstimate) accuracyScore -= 15;
  if (falseNegativeEstimate) accuracyScore -= 15;
  accuracyScore = Math.max(0, Math.min(100, Math.round(accuracyScore)));

  const insufficientData = insufficientDataHeuristic(metrics);
  if (insufficientData) {
    accuracyScore = Math.min(accuracyScore, 40);
  }

  return {
    accuracyScore,
    groundTruthWeakestStageId: gt,
    croPrimaryStageId: croPrimary,
    bottleneckMatch,
    recommendationAligned,
    falsePositiveEstimate,
    falseNegativeEstimate,
    misclassifiedStageCount: misclassifiedHeuristic(dropoffs),
    insufficientData,
    dataCoverageRatio: dataCoverageRatio(metrics),
  };
}

function pushRolling(q: CroV8FunnelComparisonQuality): CroV8FunnelComparisonSessionRolling {
  sessionRuns += 1;
  sessionAccuracySum += q.accuracyScore;
  sessionFpSum += q.falsePositiveEstimate ? 1 : 0;
  sessionFnSum += q.falseNegativeEstimate ? 1 : 0;
  if (q.accuracyScore >= 70) {
    sessionHighConfTotal += 1;
    if (q.bottleneckMatch) sessionHighConfCorrect += 1;
  }
  return {
    runs: sessionRuns,
    avgAccuracy: sessionAccuracySum / sessionRuns,
    avgFalsePositiveRate: sessionFpSum / sessionRuns,
    avgFalseNegativeRate: sessionFnSum / sessionRuns,
    highConfidenceCorrectRate: sessionHighConfTotal ? sessionHighConfCorrect / sessionHighConfTotal : 0,
  };
}

function buildComparisonWarnings(q: CroV8FunnelComparisonQuality, sampleIncorrect: string[]): string[] {
  const w: string[] = [];
  if (q.insufficientData) w.push("Heuristic: low landing volume — comparison metrics unreliable.");
  if (q.accuracyScore < 50) w.push("Heuristic: low CRO V8 calibration score for this window.");
  if (q.falsePositiveEstimate) w.push("Heuristic: possible false priority — a non-max-gap stage is marked priority.");
  if (q.falseNegativeEstimate) w.push("Heuristic: possible false negative — max-gap stage not in priority tier.");
  if (q.misclassifiedStageCount >= 2) w.push("Heuristic: unstable severity ordering vs gap ranking.");
  const streak = recentMismatchStreak.get(q.groundTruthWeakestStageId) ?? 0;
  if (streak >= 3) w.push("Heuristic: repeated mismatch involving the same ground-truth weakest stage.");
  if (sampleIncorrect.length >= 2) w.push("Heuristic: multiple sample classification mismatches logged.");
  return w;
}

/**
 * Build read-only comparison between funnel metrics (ground truth) and CRO V8 dropoffs + shadow recs.
 * Callers pass aggregates already computed — this module does not fetch DB.
 */
export function buildCroV8FunnelComparison(
  metrics: FunnelMetrics,
  dropoffs: CroV8DropoffPoint[],
  shadowRecommendations: CroV8ShadowRecommendation[],
  leakStages: readonly string[],
): CroV8FunnelComparisonResult {
  const leaksSet = new Set(leakStages);
  const rows = buildRows(metrics, dropoffs, shadowRecommendations);
  const quality = computeQuality(metrics, dropoffs, shadowRecommendations, leaksSet);
  const sampleIncorrect: string[] = [];

  if (!quality.bottleneckMatch && quality.croPrimaryStageId) {
    sampleIncorrect.push(
      `bottleneck_mismatch:gt=${quality.groundTruthWeakestStageId}:cro=${quality.croPrimaryStageId}`,
    );
    const prev = recentMismatchStreak.get(quality.groundTruthWeakestStageId) ?? 0;
    recentMismatchStreak.set(quality.groundTruthWeakestStageId, prev + 1);
  } else if (quality.bottleneckMatch) {
    recentMismatchStreak.set(quality.groundTruthWeakestStageId, 0);
  }

  const sessionRolling = pushRolling(quality);
  const observationalWarnings = buildComparisonWarnings(quality, sampleIncorrect);

  return {
    rows,
    quality,
    observationalWarnings,
    sessionRolling,
    sampleIncorrectClassifications: sampleIncorrect,
  };
}

/** Structured log for observability — no execution side effects. */
export function logCroV8FunnelComparison(result: CroV8FunnelComparisonResult): void {
  if (!croOptimizationV8Flags.croV8FunnelComparisonV1) return;
  logInfo(NS, {
    event: "cro_v8_funnel_comparison",
    stagesAnalyzed: result.rows.length,
    accuracyScore: result.quality.accuracyScore,
    bottleneckMatch: result.quality.bottleneckMatch,
    gtWeakest: result.quality.groundTruthWeakestStageId,
    croPrimary: result.quality.croPrimaryStageId,
    falsePositiveEstimate: result.quality.falsePositiveEstimate,
    falseNegativeEstimate: result.quality.falseNegativeEstimate,
    insufficientData: result.quality.insufficientData,
    mismatches: result.sampleIncorrectClassifications,
    rollingAvgAccuracy: result.sessionRolling.avgAccuracy,
    warnings: result.observationalWarnings.length,
  });
}
