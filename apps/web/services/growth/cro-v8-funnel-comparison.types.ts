/**
 * Read-only shadow vs real funnel comparison (CRO V8 validation). Does not alter tracking or execution.
 */

import type { CroV8DropoffPoint, CroV8ShadowRecommendation } from "./cro-v8-optimization.types";
import type { FunnelMetrics } from "./funnel-analysis.service";

/** Aligned funnel stages (landing → … → complete). */
export type CroV8ComparisonStageId =
  | "landing_to_cta"
  | "cta_to_lead"
  | "lead_to_booking_start"
  | "booking_start_to_complete";

export type CroV8FunnelComparisonRow = {
  stage: CroV8ComparisonStageId;
  actualRate: number;
  benchmarkRate: number;
  /** Shortfall vs benchmark (positive when observed trails benchmark). Same basis as CRO `gapVsBenchmark`. */
  dropoff: number;
  /**
   * Expected shortfall under benchmark model (identical to `dropoff` when both derive from the same metrics).
   * Kept explicit for contract stability vs future model variants.
   */
  expectedDropoff: number;
  severity: CroV8DropoffPoint["severity"];
  /** Advisory only — shadow_manual line if present for this stage. */
  recommendation?: string;
};

export type CroV8FunnelComparisonQuality = {
  /** 0–100 composite for this run. */
  accuracyScore: number;
  /** Ground-truth weakest stage = max gap among the four. */
  groundTruthWeakestStageId: CroV8ComparisonStageId;
  /** CRO emphasis stage when prioritizing `priority` severities first, else fallback ordering. */
  croPrimaryStageId: CroV8ComparisonStageId | null;
  bottleneckMatch: boolean;
  /** Shadow recs reference the ground-truth weakest stage (leak stage or drop id). */
  recommendationAligned: boolean;
  /** CRO marks `priority` on a stage that is not the global max-gap stage. */
  falsePositiveEstimate: boolean;
  /** Global max-gap stage is not represented among priority severities while another priority exists. */
  falseNegativeEstimate: boolean;
  /** Stages where severity tier appears inconsistent with relative gap rank (heuristic). */
  misclassifiedStageCount: number;
  insufficientData: boolean;
  /** Fraction of stages with meaningful volume assumptions met (0–1). */
  dataCoverageRatio: number;
};

export type CroV8FunnelComparisonSessionRolling = {
  runs: number;
  avgAccuracy: number;
  avgFalsePositiveRate: number;
  avgFalseNegativeRate: number;
  highConfidenceCorrectRate: number;
};

export type CroV8FunnelComparisonResult = {
  rows: CroV8FunnelComparisonRow[];
  quality: CroV8FunnelComparisonQuality;
  observationalWarnings: string[];
  sessionRolling: CroV8FunnelComparisonSessionRolling;
  /** Sample mismatch explanations for logs (no PII). */
  sampleIncorrectClassifications: string[];
};
