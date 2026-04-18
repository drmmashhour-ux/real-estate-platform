/**
 * Brain V8 Phase B — compare shadow outputs to current Brain snapshot signals (read-only).
 * Does not mutate DTOs, outcomes, weights, or live Brain behavior.
 */
import { logInfo, logWarn } from "@/lib/logger";
import type { BrainDecisionOutcomeDTO } from "./brain-v2.repository";
import type { BrainV8ShadowObservationResult, BrainV8ShadowOutcomeRow } from "./brain-v8-shadow.types";
import type {
  BrainV8ComparisonAggregationSnapshot,
  BrainV8ComparisonInput,
  BrainV8ComparisonInterpretation,
  BrainV8ComparisonMetrics,
  BrainV8ComparisonNormalizedSignal,
  BrainV8ComparisonPair,
  BrainV8ComparisonReport,
  BrainV8ComparisonWarning,
} from "./brain-v8-shadow-comparison.types";

const NS = "[brain:v8:comparison]";
const ALIGN_DELTA = 0.12;
const DIVERGENCE_SCORE_THRESHOLD = 0.15;

function safeFinite(n: unknown): number | undefined {
  if (typeof n !== "number" || !Number.isFinite(n)) return undefined;
  return n;
}

function clamp01(x: number): number {
  return Math.min(1, Math.max(0, x));
}

/** Map [-1,1] score to [0,1] confidence; missing → 0.5 */
export function scoreToConfidence(score: number | undefined): number {
  if (score === undefined) return 0.5;
  return clamp01((score + 1) / 2);
}

function inferEvidenceLevel(dto: BrainDecisionOutcomeDTO): BrainV8ComparisonNormalizedSignal["evidenceLevel"] {
  const s = safeFinite(dto.outcomeScore);
  if (s === undefined) return "none";
  if (dto.outcomeType === "INSUFFICIENT_DATA") return "low";
  return "medium";
}

function inferRiskFromOutcome(dto: BrainDecisionOutcomeDTO): BrainV8ComparisonNormalizedSignal["riskLevel"] {
  const t = (dto.outcomeType ?? "").toUpperCase();
  if (t.includes("FAIL") || t.includes("NEGATIVE")) return "high";
  const s = safeFinite(dto.outcomeScore);
  if (s === undefined) return "unknown";
  if (s < -0.3) return "high";
  if (s < 0.2) return "medium";
  return "low";
}

/** Read-only normalization of current Brain row from snapshot DTO. */
export function normalizeCurrentBrainSignal(dto: BrainDecisionOutcomeDTO): BrainV8ComparisonNormalizedSignal {
  const score = safeFinite(dto.outcomeScore);
  const decisionKey = typeof dto.decisionId === "string" && dto.decisionId.length > 0 ? dto.decisionId : "(unknown)";
  const confidence = scoreToConfidence(score);
  return {
    side: "current",
    decisionKey,
    sourceKey: String(dto.source ?? ""),
    signalKind: typeof dto.outcomeType === "string" ? dto.outcomeType : undefined,
    confidence,
    trust: confidence,
    score,
    reason: typeof dto.reason === "string" ? dto.reason.slice(0, 500) : undefined,
    evidenceLevel: inferEvidenceLevel(dto),
    riskLevel: inferRiskFromOutcome(dto),
    outcomeSummary: `${dto.actionType ?? "?"}:${dto.outcomeType ?? "?"}`,
  };
}

/** Read-only normalization from shadow row + optional source echo. */
export function normalizeShadowComparisonSignal(row: BrainV8ShadowOutcomeRow): BrainV8ComparisonNormalizedSignal {
  const decisionKey = typeof row.decisionId === "string" && row.decisionId.length > 0 ? row.decisionId : "(unknown)";
  const insufficient = row.insufficientEvidence === true || row.shadowLabel === "insufficient_evidence";
  const score = insufficient ? undefined : safeFinite(row.shadowSignal);
  const confidence = insufficient ? 0.5 : scoreToConfidence(score);
  let evidenceLevel: BrainV8ComparisonNormalizedSignal["evidenceLevel"] = insufficient ? "none" : "medium";
  if (row.shadowLabel === "review") evidenceLevel = "low";
  return {
    side: "shadow",
    decisionKey,
    sourceKey: String(row.source ?? ""),
    signalKind: row.shadowLabel,
    confidence,
    trust: confidence,
    score,
    reason: `shadowLabel=${row.shadowLabel};storedType=${row.storedOutcomeType}`,
    evidenceLevel,
    riskLevel: row.shadowLabel === "review" ? "medium" : insufficient ? "unknown" : "low",
    outcomeSummary: `shadow:${row.shadowLabel}`,
  };
}

function bucketByDecisionKey<T extends { decisionKey: string }>(items: T[]): Map<string, T[]> {
  const m = new Map<string, T[]>();
  for (const it of items) {
    const k = it.decisionKey;
    const arr = m.get(k) ?? [];
    arr.push(it);
    m.set(k, arr);
  }
  return m;
}

export function pairCurrentAndShadowSignals(
  currents: BrainV8ComparisonNormalizedSignal[],
  shadows: BrainV8ComparisonNormalizedSignal[],
): {
  pairs: BrainV8ComparisonPair[];
  currentOnly: BrainV8ComparisonNormalizedSignal[];
  shadowOnly: BrainV8ComparisonNormalizedSignal[];
  duplicateKeyWarnings: number;
  malformedInputWarnings: number;
} {
  let duplicateKeyWarnings = 0;
  let malformedInputWarnings = 0;

  for (const c of currents) {
    if (!c.decisionKey || c.decisionKey === "(unknown)") malformedInputWarnings++;
  }
  for (const s of shadows) {
    if (!s.decisionKey || s.decisionKey === "(unknown)") malformedInputWarnings++;
  }

  const cb = bucketByDecisionKey(currents);
  const sb = bucketByDecisionKey(shadows);
  const keys = new Set<string>([...cb.keys(), ...sb.keys()]);

  const pairs: BrainV8ComparisonPair[] = [];
  const currentOnly: BrainV8ComparisonNormalizedSignal[] = [];
  const shadowOnly: BrainV8ComparisonNormalizedSignal[] = [];

  for (const key of keys) {
    const cs = cb.get(key) ?? [];
    const ss = sb.get(key) ?? [];
    if (cs.length > 1 || ss.length > 1) duplicateKeyWarnings += Math.max(0, Math.max(cs.length, ss.length) - 1);

    const n = Math.min(cs.length, ss.length);
    for (let i = 0; i < n; i++) {
      const current = cs[i]!;
      const shadow = ss[i]!;
      const sc = safeFinite(current.score);
      const sh = safeFinite(shadow.score);
      const scoreDelta = sc !== undefined && sh !== undefined ? Math.abs(sc - sh) : 0;
      const confidenceDelta = Math.abs(current.confidence - shadow.confidence);
      const trustDelta = Math.abs(current.trust - shadow.trust);
      const scoreDiverged =
        (sc !== undefined && sh !== undefined && scoreDelta > DIVERGENCE_SCORE_THRESHOLD) ||
        (sc !== undefined && sh !== undefined && Math.abs(sc - sh) >= ALIGN_DELTA && shadow.signalKind === "review");
      const insufficientVs = shadow.signalKind === "insufficient_evidence" && sc !== undefined;
      const riskDisagreement =
        current.riskLevel === "high" && (shadow.riskLevel === "low" || shadow.signalKind === "aligned") && !insufficientVs
          ? true
          : shadow.riskLevel === "high" && current.riskLevel === "low";
      const reasonDiffers =
        Boolean(current.reason && shadow.reason && current.reason.slice(0, 40) !== shadow.reason.slice(0, 40));

      pairs.push({
        decisionKey: key,
        current,
        shadow,
        scoreDelta,
        confidenceDelta,
        trustDelta,
        scoreDiverged,
        riskDisagreement,
        insufficientEvidenceVsCurrent: insufficientVs,
        reasonDiffers,
      });
    }
    if (cs.length > n) currentOnly.push(...cs.slice(n));
    if (ss.length > n) shadowOnly.push(...ss.slice(n));
  }

  return { pairs, currentOnly, shadowOnly, duplicateKeyWarnings, malformedInputWarnings };
}

export function computeBrainV8ComparisonMetrics(
  pairs: BrainV8ComparisonPair[],
  currentOnly: BrainV8ComparisonNormalizedSignal[],
  shadowOnly: BrainV8ComparisonNormalizedSignal[],
  extraInsufficientFromRows: number,
  duplicateKeyWarnings: number,
  malformedInputWarnings: number,
): BrainV8ComparisonMetrics {
  const matchedCount = pairs.length;
  const currentOnlyCount = currentOnly.length;
  const shadowOnlyCount = shadowOnly.length;
  const unionRows = matchedCount + currentOnlyCount + shadowOnlyCount;
  const overlapRate = unionRows > 0 ? matchedCount / unionRows : 0;

  const divergedPairs = pairs.filter((p) => p.scoreDiverged || p.riskDisagreement);
  const divergenceRate = matchedCount > 0 ? divergedPairs.length / matchedCount : 0;

  const meanAbs = (xs: number[]) =>
    xs.length === 0 ? 0 : Number((xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(6));

  const meanAbsConfidenceDelta = meanAbs(pairs.map((p) => p.confidenceDelta));
  const meanAbsTrustDelta = meanAbs(pairs.map((p) => p.trustDelta));
  const meanAbsScoreDelta = meanAbs(pairs.map((p) => p.scoreDelta));

  return {
    matchedCount,
    currentOnlyCount,
    shadowOnlyCount,
    overlapRate: Number(overlapRate.toFixed(6)),
    divergenceRate: Number(divergenceRate.toFixed(6)),
    meanAbsConfidenceDelta,
    meanAbsTrustDelta,
    meanAbsScoreDelta,
    reasonDifferenceCount: pairs.filter((p) => p.reasonDiffers).length,
    riskDisagreementCount: pairs.filter((p) => p.riskDisagreement).length,
    insufficientEvidenceCount: extraInsufficientFromRows,
    insufficientEvidenceVsCurrentCount: pairs.filter((p) => p.insufficientEvidenceVsCurrent).length,
    duplicateKeyWarnings,
    malformedInputWarnings,
  };
}

function buildInterpretation(
  metrics: BrainV8ComparisonMetrics,
  pairs: BrainV8ComparisonPair[],
  currentOnly: BrainV8ComparisonNormalizedSignal[] = [],
  shadowOnly: BrainV8ComparisonNormalizedSignal[] = [],
): BrainV8ComparisonInterpretation {
  const heuristicSummaries: string[] = [];
  const warnings: BrainV8ComparisonWarning[] = [];

  const highRiskCurrentUnpaired = currentOnly.filter((c) => c.riskLevel === "high").length;
  if (highRiskCurrentUnpaired > 0) {
    heuristicSummaries.push(
      `Heuristic: missing important signals — ${highRiskCurrentUnpaired} high-risk current row(s) had no shadow pair (coverage gap).`,
    );
  }

  const elevatedShadowUnpaired = shadowOnly.filter(
    (s) => s.riskLevel === "high" || s.signalKind === "review" || s.evidenceLevel === "none",
  ).length;
  if (elevatedShadowUnpaired > 0) {
    heuristicSummaries.push(
      `Heuristic: extra risky signals — ${elevatedShadowUnpaired} shadow-only row(s) carry elevated/review/insufficient evidence without a current pair.`,
    );
  }

  const currentScores = pairs.map((p) => safeFinite(p.current.score)).filter((x): x is number => x !== undefined);
  const shadowScores = pairs.map((p) => safeFinite(p.shadow.score)).filter((x): x is number => x !== undefined);
  const meanCurrentScore =
    currentScores.length > 0 ? currentScores.reduce((a, b) => a + b, 0) / currentScores.length : 0;
  const meanShadowScore =
    shadowScores.length > 0 ? shadowScores.reduce((a, b) => a + b, 0) / shadowScores.length : 0;

  if (pairs.length > 0 && Number.isFinite(meanCurrentScore) && Number.isFinite(meanShadowScore)) {
    if (meanShadowScore < meanCurrentScore - 0.05) {
      heuristicSummaries.push(
        "Heuristic: shadow mean score is lower than current — shadow may appear more conservative on this sample (observational, not a guarantee).",
      );
    } else if (meanShadowScore > meanCurrentScore + 0.05) {
      heuristicSummaries.push(
        "Heuristic: shadow mean score is higher than current — shadow may appear more aggressive on this sample (observational, not a guarantee).",
      );
    }
  }

  if (metrics.currentOnlyCount > 0) {
    heuristicSummaries.push(
      `Heuristic: ${metrics.currentOnlyCount} current-only row(s) — shadow pass did not pair them (sample/coverage skew possible).`,
    );
  }
  if (metrics.shadowOnlyCount > 0) {
    heuristicSummaries.push(
      `Heuristic: ${metrics.shadowOnlyCount} shadow-only row(s) — unusual if slices were aligned; check duplicate keys or pipeline skew.`,
    );
  }

  const shadowOnlyRisky = pairs.filter((p) => p.shadow.riskLevel === "high" && p.current.riskLevel !== "high").length;
  if (shadowOnlyRisky >= 2) {
    heuristicSummaries.push(
      `Heuristic: ${shadowOnlyRisky} matched pair(s) show higher shadow-side risk than current (qualitative; verify manually).`,
    );
    warnings.push({
      code: "repeated_shadow_only_risky",
      message: "Several pairs show elevated shadow risk vs current — review manually before any cutover planning.",
    });
  }

  const currentCriticalMissed = pairs.filter(
    (p) => p.current.riskLevel === "high" && (p.shadow.signalKind === "aligned" || p.shadow.riskLevel === "low"),
  ).length;
  if (currentCriticalMissed >= 2) {
    warnings.push({
      code: "current_critical_missed_by_shadow",
      message: "Multiple high-risk current rows look 'calm' in shadow labels — insufficient_evidence or labeling skew possible.",
    });
  }

  if (metrics.overlapRate < 0.35 && metrics.matchedCount + metrics.currentOnlyCount + metrics.shadowOnlyCount > 3) {
    warnings.push({ code: "low_overlap", message: "Overlap rate is very low — comparison coverage may be unreliable for this run." });
  }
  if (metrics.divergenceRate > 0.55 && metrics.matchedCount >= 3) {
    warnings.push({
      code: "high_divergence",
      message: "Divergence rate is high among matched pairs — shadow and current disagree often on this sample.",
    });
  }

  const instRate =
    metrics.matchedCount + metrics.currentOnlyCount + metrics.shadowOnlyCount > 0
      ? metrics.insufficientEvidenceCount / Math.max(1, metrics.matchedCount + metrics.shadowOnlyCount)
      : 0;
  if (instRate > 0.45 && metrics.matchedCount >= 2) {
    warnings.push({
      code: "high_insufficient_evidence_rate",
      message: "Many shadow rows mark insufficient evidence — aggregate deltas may be thin.",
    });
  }

  if (metrics.duplicateKeyWarnings >= 3) {
    warnings.push({ code: "duplicate_keys", message: "Repeated decision keys — pairing used first-in-order; metrics may be skewed." });
  }
  if (metrics.malformedInputWarnings >= 2) {
    warnings.push({ code: "malformed_inputs", message: "Several rows had unknown decision keys — check upstream outcome integrity." });
  }

  const confSpread = pairs.map((p) => p.confidenceDelta);
  const avgSpread = confSpread.length ? confSpread.reduce((a, b) => a + b, 0) / confSpread.length : 0;
  if (avgSpread > 0.35 && pairs.length >= 4) {
    heuristicSummaries.push("Heuristic: confidence deltas are wide — shadow vs current stability may differ on this window.");
  }

  return { heuristicSummaries, warnings };
}

let lastReport: BrainV8ComparisonReport | null = null;
let comparisonRuns = 0;
let sumOverlap = 0;
let sumDiv = 0;
let runsStrongAgreement = 0;
let runsHighRiskDisagreement = 0;
let runsHighInsufficient = 0;

function recordAggregation(metrics: BrainV8ComparisonMetrics): BrainV8ComparisonAggregationSnapshot {
  comparisonRuns += 1;
  sumOverlap += metrics.overlapRate;
  sumDiv += metrics.divergenceRate;
  if (metrics.overlapRate >= 0.7) runsStrongAgreement += 1;
  if (metrics.divergenceRate >= 0.4) runsHighRiskDisagreement += 1;
  const sampleDenom = metrics.matchedCount + metrics.currentOnlyCount + metrics.shadowOnlyCount;
  const insRate = sampleDenom > 0 ? metrics.insufficientEvidenceCount / sampleDenom : 0;
  if (insRate >= 0.35) runsHighInsufficient += 1;

  return {
    comparisonRuns,
    avgOverlapRate: comparisonRuns > 0 ? Number((sumOverlap / comparisonRuns).toFixed(6)) : 0,
    avgDivergenceRate: comparisonRuns > 0 ? Number((sumDiv / comparisonRuns).toFixed(6)) : 0,
    strongAgreementRunRate: comparisonRuns > 0 ? Number((runsStrongAgreement / comparisonRuns).toFixed(6)) : 0,
    highRiskDisagreementRunRate: comparisonRuns > 0 ? Number((runsHighRiskDisagreement / comparisonRuns).toFixed(6)) : 0,
    highInsufficientEvidenceRunRate: comparisonRuns > 0 ? Number((runsHighInsufficient / comparisonRuns).toFixed(6)) : 0,
  };
}

/** Exposed for tests / admin diagnostics (in-process; empty on cold serverless instances). */
export function getLastBrainV8ComparisonReport(): BrainV8ComparisonReport | null {
  return lastReport;
}

export function resetBrainV8ComparisonAggregationForTests(): void {
  lastReport = null;
  comparisonRuns = 0;
  sumOverlap = 0;
  sumDiv = 0;
  runsStrongAgreement = 0;
  runsHighRiskDisagreement = 0;
  runsHighInsufficient = 0;
}

/**
 * Build a full comparison report from the same outcome slice used to build shadow rows.
 * Does not mutate `outcomesSlice` or `shadowResult`.
 */
export function buildBrainV8ShadowVsCurrentComparison(input: BrainV8ComparisonInput): BrainV8ComparisonReport {
  const { outcomesSlice, shadowResult } = input;
  const runId = `v8cmp-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const observedAt = new Date().toISOString();

  const currentSignals = outcomesSlice.map((dto) => normalizeCurrentBrainSignal(dto));
  const shadowSignals = shadowResult.rows.map((row) => normalizeShadowComparisonSignal(row));

  const { pairs, currentOnly, shadowOnly, duplicateKeyWarnings, malformedInputWarnings } = pairCurrentAndShadowSignals(
    currentSignals,
    shadowSignals,
  );

  const extraInsufficient = shadowResult.rows.filter(
    (r) => r.insufficientEvidence || r.shadowLabel === "insufficient_evidence",
  ).length;

  const metrics = computeBrainV8ComparisonMetrics(
    pairs,
    currentOnly,
    shadowOnly,
    extraInsufficient,
    duplicateKeyWarnings,
    malformedInputWarnings,
  );

  const interpretation = buildInterpretation(metrics, pairs, currentOnly, shadowOnly);

  const mismatchSample: BrainV8ComparisonReport["mismatchSample"] = [];
  for (const c of currentOnly.slice(0, 5)) {
    mismatchSample.push({
      decisionKey: c.decisionKey,
      kind: "current_only",
      detail: "No shadow row paired for this decision key",
    });
  }
  for (const s of shadowOnly.slice(0, 5)) {
    mismatchSample.push({
      decisionKey: s.decisionKey,
      kind: "shadow_only",
      detail: "No current row paired for this decision key",
    });
  }
  for (const p of pairs.filter((x) => x.scoreDiverged || x.riskDisagreement).slice(0, 5)) {
    mismatchSample.push({
      decisionKey: p.decisionKey,
      kind: "diverged_pair",
      detail: `scoreDelta=${p.scoreDelta.toFixed(4)} shadow=${p.shadow.signalKind}`,
    });
  }

  const aggregation = recordAggregation(metrics);

  const report: BrainV8ComparisonReport = {
    runId,
    observedAt,
    sampleSize: outcomesSlice.length,
    metrics,
    pairsSample: pairs.slice(0, 12),
    mismatchSample,
    interpretation,
    aggregation,
  };

  lastReport = report;

  logInfo(NS, {
    runId: report.runId,
    sampleSize: report.sampleSize,
    metrics: report.metrics,
    heuristicCount: report.interpretation.heuristicSummaries.length,
    warningCodes: report.interpretation.warnings.map((w) => w.code),
    mismatchSample: report.mismatchSample.slice(0, 8),
    aggregation: report.aggregation,
  });

  if (report.interpretation.warnings.length > 0) {
    logWarn(NS, "observational_warnings", { runId: report.runId, warnings: report.interpretation.warnings });
  }

  return report;
}
