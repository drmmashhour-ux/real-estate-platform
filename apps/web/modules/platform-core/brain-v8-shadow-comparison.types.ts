/**
 * Brain V8 Phase B — shadow vs current comparison (read-only analysis types).
 * Heuristic summaries are observational only, not ground truth.
 */

import type { BrainDecisionOutcomeDTO } from "./brain-v2.repository";
import type { BrainV8ShadowObservationResult } from "./brain-v8-shadow.types";

/** Normalized signal for comparison — both sides map into this shape without mutating source DTOs/rows. */
export type BrainV8ComparisonNormalizedSignal = {
  side: "current" | "shadow";
  /** Primary stable key (decision id from domain). */
  decisionKey: string;
  /** Secondary key for grouping (e.g. learning source). */
  sourceKey?: string;
  signalKind?: string;
  /** 0–1 scale derived from finite scores when present; default 0.5 when unknown. */
  confidence: number;
  /** Same numeric space as confidence for this phase when no separate trust field exists. */
  trust: number;
  /** Raw-ish score in [-1, 1] when finite; undefined when missing. */
  score?: number;
  reason?: string;
  evidenceLevel: "none" | "low" | "medium" | "high" | "unknown";
  riskLevel: "low" | "medium" | "high" | "unknown";
  outcomeSummary?: string;
};

export type BrainV8ComparisonPair = {
  decisionKey: string;
  current: BrainV8ComparisonNormalizedSignal;
  shadow: BrainV8ComparisonNormalizedSignal;
  scoreDelta: number;
  confidenceDelta: number;
  trustDelta: number;
  /** True when |scoreDelta| exceeds alignment threshold (observational). */
  scoreDiverged: boolean;
  /** Shadow label vs current evidence heuristic mismatch (observational). */
  riskDisagreement: boolean;
  /** Shadow marked insufficient_evidence while current had finite score. */
  insufficientEvidenceVsCurrent: boolean;
  /** Reason strings differ materially (heuristic). */
  reasonDiffers: boolean;
};

export type BrainV8ComparisonMetrics = {
  /** Rows successfully paired (same decision key, consumed in order for duplicates). */
  matchedCount: number;
  currentOnlyCount: number;
  shadowOnlyCount: number;
  /** Paired rows / (paired + current-only + shadow-only row counts). */
  overlapRate: number;
  /** Among matched pairs: fraction with scoreDiverged or risk disagreement. */
  divergenceRate: number;
  /** Among matched: mean |confidence_current - confidence_shadow|. */
  meanAbsConfidenceDelta: number;
  meanAbsTrustDelta: number;
  meanAbsScoreDelta: number;
  reasonDifferenceCount: number;
  riskDisagreementCount: number;
  insufficientEvidenceCount: number;
  /** Matched pairs where shadow says insufficient vs finite current score. */
  insufficientEvidenceVsCurrentCount: number;
  duplicateKeyWarnings: number;
  malformedInputWarnings: number;
};

/** Rolling aggregates — in-process only; for ops/debug, not authoritative. */
export type BrainV8ComparisonAggregationSnapshot = {
  comparisonRuns: number;
  avgOverlapRate: number;
  avgDivergenceRate: number;
  /** Fraction of runs with overlapRate >= 0.7 */
  strongAgreementRunRate: number;
  /** Fraction of runs with divergenceRate >= 0.4 */
  highRiskDisagreementRunRate: number;
  /** Fraction of runs where insufficientEvidenceCount / max(sample,1) >= 0.35 */
  highInsufficientEvidenceRunRate: number;
};

export type BrainV8ComparisonWarning = {
  code: string;
  message: string;
};

export type BrainV8ComparisonInterpretation = {
  /** Each line is prefixed as heuristic in the producer; kept separate for UI/log. */
  heuristicSummaries: string[];
  warnings: BrainV8ComparisonWarning[];
};

export type BrainV8ComparisonReport = {
  runId: string;
  observedAt: string;
  sampleSize: number;
  metrics: BrainV8ComparisonMetrics;
  pairsSample: BrainV8ComparisonPair[];
  /** Cap for logging / payloads */
  mismatchSample: Array<{
    decisionKey: string;
    kind: "current_only" | "shadow_only" | "diverged_pair";
    detail: string;
  }>;
  interpretation: BrainV8ComparisonInterpretation;
  aggregation: BrainV8ComparisonAggregationSnapshot;
};

export type BrainV8ComparisonInput = {
  outcomesSlice: BrainDecisionOutcomeDTO[];
  shadowResult: BrainV8ShadowObservationResult;
};
