/**
 * Async bridge for V8 CRO bundle — uses existing read-only growth aggregates only.
 */
import { croOptimizationV8Flags } from "@/config/feature-flags";
import { getAdsPerformanceForWindow, getFullGrowthAnalysis } from "@/modules/ads/ads-performance.service";
import {
  analyzeCroV8Dropoffs,
  buildCroV8ExperimentReadiness,
  buildCroV8ShadowRecommendations,
} from "./cro-v8-optimization.service";
import { buildCroV8FunnelComparison, logCroV8FunnelComparison } from "./cro-v8-funnel-comparison.service";
import type { CroV8OptimizationBundle } from "./cro-v8-optimization.types";

export type RunCroV8OptimizationInput = {
  rangeDays: number;
  offsetDays?: number;
  estimatedSpend?: number;
};

/**
 * Returns null when `FEATURE_CRO_V8_ANALYSIS_V1` is off (no DB read — preserves cost when disabled).
 */
export async function runCroV8OptimizationBundle(input: RunCroV8OptimizationInput): Promise<CroV8OptimizationBundle | null> {
  if (!croOptimizationV8Flags.croV8AnalysisV1) {
    return null;
  }

  const rangeDays = input.rangeDays;
  const offsetDays = input.offsetDays ?? 0;
  const until = new Date(Date.now() - offsetDays * 864e5);
  const since = new Date(until.getTime() - rangeDays * 864e5);

  const w = await getAdsPerformanceForWindow(since, until, { estimatedSpend: input.estimatedSpend });
  const events = {
    landing_view: w.impressions,
    cta_click: w.clicks,
    lead_capture: w.leads,
    booking_started: w.bookingsStarted,
    booking_completed: w.bookingsCompleted,
  };

  const full = getFullGrowthAnalysis(events);
  const dropoffs = analyzeCroV8Dropoffs(full.metrics);

  const shadowRecommendations = croOptimizationV8Flags.croV8ShadowRecommendationsV1
    ? buildCroV8ShadowRecommendations(full.leaks, dropoffs)
    : [];

  const experimentReadiness = croOptimizationV8Flags.croV8ExperimentHooksV1 ? buildCroV8ExperimentReadiness() : null;

  const funnelComparison = croOptimizationV8Flags.croV8FunnelComparisonV1
    ? buildCroV8FunnelComparison(
        full.metrics,
        dropoffs,
        shadowRecommendations,
        full.leaks.map((l) => l.stage),
      )
    : null;
  if (funnelComparison) {
    logCroV8FunnelComparison(funnelComparison);
  }

  return {
    mode: "cro_v8_safe",
    rangeDays,
    window: { since: w.since, until: w.until },
    metrics: full.metrics,
    leaks: full.leaks,
    fixes: full.fixes,
    healthScore: full.healthScore,
    dropoffs,
    shadowRecommendations,
    experimentReadiness,
    funnelComparison,
  };
}
