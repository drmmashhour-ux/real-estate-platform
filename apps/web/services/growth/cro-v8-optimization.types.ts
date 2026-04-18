/**
 * V8-safe CRO layer — advisory types only (no live funnel mutations).
 */

import type { FunnelLeak, FunnelLeakStage, FunnelMetrics } from "./funnel-analysis.service";
import type { FunnelFix } from "./funnel-fix-engine.service";

export type CroV8DropoffSeverity = "info" | "watch" | "priority";

export type CroV8DropoffPoint = {
  id: string;
  fromStep: string;
  toStep: string;
  /** Observed stage ratio (same basis as funnel-analysis ratios). */
  observedRatio: number;
  benchmarkRatio: number;
  /** Positive when observed is below benchmark (larger = worse gap). */
  gapVsBenchmark: number;
  severity: CroV8DropoffSeverity;
  notes: string[];
};

export type CroV8ShadowRecommendation = {
  id: string;
  targetStage: FunnelLeakStage | "PORTFOLIO";
  title: string;
  hypothesis: string;
  /** Shadow-only — never auto-applied by this layer. */
  executionMode: "shadow_manual";
};

export type CroV8ExperimentHookPoint = {
  id: string;
  description: string;
  /** Logical event keys aligned with growth funnel instrumentation (documentation). */
  relatedEventKeys: string[];
};

export type CroV8ExperimentReadiness = {
  version: 1;
  namespace: "cro_v8";
  primaryMetricKeys: readonly string[];
  hookPoints: CroV8ExperimentHookPoint[];
  prerequisites: {
    /** Suggested co-flag for real experiments (informational). */
    abTestingSuggested: boolean;
  };
  disclaimers: string[];
};

export type CroV8OptimizationBundle = {
  mode: "cro_v8_safe";
  rangeDays: number;
  window: { since: string; until: string };
  metrics: FunnelMetrics;
  leaks: FunnelLeak[];
  fixes: FunnelFix[];
  healthScore: number;
  dropoffs: CroV8DropoffPoint[];
  /** Empty when `FEATURE_CRO_V8_SHADOW_RECS_V1` is off. */
  shadowRecommendations: CroV8ShadowRecommendation[];
  /** Null when `FEATURE_CRO_V8_EXPERIMENT_HOOKS_V1` is off. */
  experimentReadiness: CroV8ExperimentReadiness | null;
  /** Null when `FEATURE_CRO_V8_FUNNEL_COMPARISON_V1` is off — read-only validation of CRO vs funnel metrics. */
  funnelComparison: import("./cro-v8-funnel-comparison.types").CroV8FunnelComparisonResult | null;
};
