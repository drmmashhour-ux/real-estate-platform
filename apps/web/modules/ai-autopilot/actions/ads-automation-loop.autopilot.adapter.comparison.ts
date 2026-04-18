/**
 * Ads Autopilot V8 — LIVE vs SHADOW comparison (analysis only).
 * Read-only metrics; does not influence execution or live builder output.
 */
import { randomUUID } from "node:crypto";
import type { ProposedAction } from "../ai-autopilot.types";
import { buildAdsAutopilotComparisonMetrics, type AdsAutopilotComparisonMetrics } from "./ads-automation-loop.autopilot.adapter.influence";
import {
  compareAdsAutopilotProposalSets,
  getAdsAutopilotProposalKey,
  type AdsAutopilotShadowDiff,
} from "./ads-automation-loop.autopilot.adapter.shadow";

function confidenceFromReasons(r: Record<string, unknown>): number | null {
  const c = r.confidence;
  return typeof c === "number" && Number.isFinite(c) ? c : null;
}

/** Comparison-safe normalized row (both streams map from ProposedAction). */
export type NormalizedAdsDecision = {
  actionType: string;
  targetId: string | null;
  campaignId?: string | null;
  budget?: number | null;
  bid?: number | null;
  message?: string | null;
  confidence?: number | null;
  reason?: string | null;
};

export function normalizeProposedAction(a: ProposedAction): NormalizedAdsDecision {
  const p = a.recommendedPayload ?? {};
  const campaignId =
    typeof p.campaignId === "string"
      ? p.campaignId
      : typeof p.campaignId === "number"
        ? String(p.campaignId)
        : undefined;
  const budget = typeof p.budget === "number" && Number.isFinite(p.budget) ? p.budget : undefined;
  const bid = typeof p.bid === "number" && Number.isFinite(p.bid) ? p.bid : undefined;
  const message =
    typeof p.message === "string"
      ? p.message
      : typeof a.summary === "string"
        ? a.summary
        : undefined;
  const reason =
    typeof a.reasons?.reason === "string"
      ? (a.reasons.reason as string)
      : typeof a.summary === "string"
        ? a.summary
        : undefined;

  return {
    actionType: a.actionType,
    targetId: a.entityId,
    campaignId: campaignId ?? null,
    budget: budget ?? null,
    bid: bid ?? null,
    message: message ?? null,
    confidence: confidenceFromReasons(a.reasons),
    reason: reason ?? null,
  };
}

export type AdsV8QualitySignals = {
  /** Mean shadow confidence < mean live on matched keys (both sides numeric). */
  shadowMoreConservative: boolean | null;
  /** Shadow-only rows or higher mean confidence on matched keys. */
  shadowMoreAggressive: boolean | null;
  /** Live has high/critical severity action with no shadow counterpart (by key). */
  shadowMissesCriticalLiveActions: boolean;
  /** Shadow-only or shadow HIGH risk where live had no matching key. */
  shadowIntroducesRiskyActions: boolean;
};

function severityRank(s: string): number {
  const x = (s || "").toLowerCase();
  if (x === "critical") return 4;
  if (x === "high") return 3;
  if (x === "medium") return 2;
  if (x === "low") return 1;
  return 0;
}

function isLiveCriticalSeverity(a: ProposedAction): boolean {
  return severityRank(a.severity) >= 3;
}

function computeQualitySignals(
  live: ProposedAction[],
  shadow: ProposedAction[],
  diff: AdsAutopilotShadowDiff,
): AdsV8QualitySignals {
  const liveMap = new Map(live.map((a) => [getAdsAutopilotProposalKey(a), a]));
  const shadowMap = new Map(shadow.map((a) => [getAdsAutopilotProposalKey(a), a]));

  let sumLive = 0;
  let sumShadow = 0;
  let n = 0;
  for (const p of diff.confidencePairs) {
    if (p.live == null || p.shadow == null) continue;
    sumLive += p.live;
    sumShadow += p.shadow;
    n++;
  }
  const shadowMoreConservative = n > 0 ? sumShadow < sumLive - 1e-6 : null;
  let shadowMoreAggressive: boolean | null = null;
  if (diff.onlyInShadow.length > diff.onlyInLive.length) shadowMoreAggressive = true;
  else if (n > 0) shadowMoreAggressive = sumShadow > sumLive + 1e-6;

  let shadowMissesCriticalLiveActions = false;
  for (const k of diff.onlyInLive) {
    const a = liveMap.get(k);
    if (a && isLiveCriticalSeverity(a)) shadowMissesCriticalLiveActions = true;
  }
  for (const k of [...liveMap.keys()].filter((k) => shadowMap.has(k))) {
    const l = liveMap.get(k);
    const s = shadowMap.get(k);
    if (l && isLiveCriticalSeverity(l) && s && !isLiveCriticalSeverity(s)) {
      shadowMissesCriticalLiveActions = true;
    }
  }

  let shadowIntroducesRiskyActions = false;
  for (const k of diff.onlyInShadow) {
    const s = shadowMap.get(k);
    if (s && (s.riskLevel === "HIGH" || severityRank(s.severity) >= 3)) shadowIntroducesRiskyActions = true;
  }

  return {
    shadowMoreConservative,
    shadowMoreAggressive: shadowMoreAggressive ?? null,
    shadowMissesCriticalLiveActions,
    shadowIntroducesRiskyActions,
  };
}

const LOW_OVERLAP_WARN = 0.35;
const MAX_SHADOW_ONLY_RATIO = 0.55;
const HIGH_DIVERGENCE_DELTA = 0.2;

export type AdsV8ComparisonWarning = { code: string; detail: string };

export function buildAdsV8ComparisonWarnings(
  metrics: AdsAutopilotComparisonMetrics,
  quality: AdsV8QualitySignals,
  liveCount: number,
  shadowCount: number,
): AdsV8ComparisonWarning[] {
  const w: AdsV8ComparisonWarning[] = [];
  if (metrics.overlapRate < LOW_OVERLAP_WARN && (liveCount > 0 || shadowCount > 0)) {
    w.push({ code: "low_overlap", detail: `overlapRate=${metrics.overlapRate}` });
  }
  if (shadowCount > 0 && metrics.onlyInShadow / shadowCount > MAX_SHADOW_ONLY_RATIO) {
    w.push({ code: "shadow_many_unique", detail: `onlyInShadow=${metrics.onlyInShadow}/${shadowCount}` });
  }
  if (quality.shadowMissesCriticalLiveActions) {
    w.push({ code: "shadow_misses_critical", detail: "live had critical/high severity without shadow parity" });
  }
  if (metrics.meanAbsConfidenceDelta > HIGH_DIVERGENCE_DELTA && metrics.matchedKeyCount > 0) {
    w.push({ code: "confidence_unstable", detail: `meanAbsDelta=${metrics.meanAbsConfidenceDelta}` });
  }
  if (metrics.maxAbsConfidenceDelta > 0.35) {
    w.push({ code: "large_confidence_spike", detail: `maxAbsDelta=${metrics.maxAbsConfidenceDelta}` });
  }
  if (quality.shadowIntroducesRiskyActions) {
    w.push({ code: "shadow_risky_actions", detail: "shadow-only or high-risk shadow rows detected" });
  }
  return w;
}

export type AdsV8ComparisonReport = {
  runId: string;
  userId: string | null;
  metrics: AdsAutopilotComparisonMetrics;
  quality: AdsV8QualitySignals;
  /** Keys only in live / shadow (for samples). */
  onlyInLiveKeys: string[];
  onlyInShadowKeys: string[];
  /** Up to 3 short reason-diff strings for matched keys with both reasons. */
  reasonDiffSamples: string[];
  warnings: AdsV8ComparisonWarning[];
  /** Flat object for structured log / persistence. */
  logPayload: Record<string, unknown>;
  persistencePayload: Record<string, unknown>;
};

function sampleReasonDiffs(live: ProposedAction[], shadow: ProposedAction[], diff: AdsAutopilotShadowDiff, max = 3): string[] {
  const liveMap = new Map(live.map((a) => [getAdsAutopilotProposalKey(a), a]));
  const shadowMap = new Map(shadow.map((a) => [getAdsAutopilotProposalKey(a), a]));
  const out: string[] = [];
  for (const key of diff.confidencePairs) {
    if (out.length >= max) break;
    if (!liveMap.has(key.key) || !shadowMap.has(key.key)) continue;
    const l = liveMap.get(key.key)!;
    const s = shadowMap.get(key.key)!;
    const lr = normalizeProposedAction(l).reason ?? "";
    const sr = normalizeProposedAction(s).reason ?? "";
    if (lr !== sr) out.push(`${key.key}: live≠shadow reason`);
  }
  return out;
}

/**
 * Full Phase B comparison report (read-only). Safe with empty inputs.
 */
export function buildAdsV8ComparisonReport(input: {
  userId: string;
  live: ProposedAction[];
  shadow: ProposedAction[];
  runId?: string;
}): AdsV8ComparisonReport {
  const runId = input.runId ?? randomUUID();
  const diff = compareAdsAutopilotProposalSets(input.live, input.shadow);
  const metrics = buildAdsAutopilotComparisonMetrics(input.live, input.shadow, diff);
  const quality = computeQualitySignals(input.live, input.shadow, diff);
  const warnings = buildAdsV8ComparisonWarnings(
    metrics,
    quality,
    input.live.length,
    input.shadow.length,
  );
  const reasonDiffSamples = sampleReasonDiffs(input.live, input.shadow, diff);

  const logPayload: Record<string, unknown> = {
    runId,
    userId: input.userId || null,
    liveCount: input.live.length,
    shadowCount: input.shadow.length,
    overlapRate: metrics.overlapRate,
    divergenceRate: metrics.divergenceRate,
    onlyInLive: metrics.onlyInLive,
    onlyInShadow: metrics.onlyInShadow,
    matchedKeyCount: metrics.matchedKeyCount,
    unionKeyCount: metrics.unionKeyCount,
    meanAbsConfidenceDelta: metrics.meanAbsConfidenceDelta,
    maxAbsConfidenceDelta: metrics.maxAbsConfidenceDelta,
    weakComparison: metrics.weakComparison,
    quality,
    warnings: warnings.map((x) => x.code),
  };

  const persistencePayload = {
    runId,
    overlapRate: metrics.overlapRate,
    divergenceRate: metrics.divergenceRate,
    onlyInLive: metrics.onlyInLive,
    onlyInShadow: metrics.onlyInShadow,
    matchedKeyCount: metrics.matchedKeyCount,
    quality,
    warningCodes: warnings.map((w) => w.code),
  };

  return {
    runId,
    userId: input.userId || null,
    metrics,
    quality,
    onlyInLiveKeys: diff.onlyInLive,
    onlyInShadowKeys: diff.onlyInShadow,
    reasonDiffSamples,
    warnings,
    logPayload,
    persistencePayload,
  };
}

/* --- Rolling in-memory aggregation (observability only; process-local) --- */

type Agg = {
  runs: number;
  sumOverlap: number;
  sumDivergence: number;
  runsHeuristicAligned: number;
  runsRisky: number;
};

let agg: Agg = {
  runs: 0,
  sumOverlap: 0,
  sumDivergence: 0,
  runsHeuristicAligned: 0,
  runsRisky: 0,
};

/** Heuristic: high overlap + low mean delta. */
function isHeuristicShadowQualityOk(m: AdsAutopilotComparisonMetrics): boolean {
  return m.overlapRate >= 0.75 && m.meanAbsConfidenceDelta <= 0.08 && m.onlyInLive === 0 && m.onlyInShadow === 0;
}

export function recordAdsV8ComparisonAggregation(report: AdsV8ComparisonReport): void {
  agg.runs += 1;
  agg.sumOverlap += report.metrics.overlapRate;
  agg.sumDivergence += report.metrics.divergenceRate;
  if (isHeuristicShadowQualityOk(report.metrics)) agg.runsHeuristicAligned += 1;
  if (report.quality.shadowIntroducesRiskyActions || report.warnings.some((w) => w.code === "shadow_risky_actions")) {
    agg.runsRisky += 1;
  }
}

export function getAdsV8ComparisonAggregationSnapshot(): {
  runs: number;
  avgOverlapRate: number | null;
  avgDivergenceRate: number | null;
  pctRunsHeuristicAligned: number | null;
  pctRunsRisky: number | null;
} {
  if (agg.runs === 0) {
    return {
      runs: 0,
      avgOverlapRate: null,
      avgDivergenceRate: null,
      pctRunsHeuristicAligned: null,
      pctRunsRisky: null,
    };
  }
  return {
    runs: agg.runs,
    avgOverlapRate: Number((agg.sumOverlap / agg.runs).toFixed(6)),
    avgDivergenceRate: Number((agg.sumDivergence / agg.runs).toFixed(6)),
    pctRunsHeuristicAligned: Number(((100 * agg.runsHeuristicAligned) / agg.runs).toFixed(2)),
    pctRunsRisky: Number(((100 * agg.runsRisky) / agg.runs).toFixed(2)),
  };
}

export function resetAdsV8ComparisonAggregationForTests(): void {
  agg = { runs: 0, sumOverlap: 0, sumDivergence: 0, runsHeuristicAligned: 0, runsRisky: 0 };
}
