/**
 * Phase G — stable executive feed contract for command centers / governance consumers (read-only).
 */
import { globalFusionFlags } from "@/config/feature-flags";
import { buildGlobalFusionExecutiveSummary, type BuildExecutiveSummaryOpts } from "./global-fusion-executive.service";
import { recordExecutiveFeedEmitted } from "./global-fusion-executive-monitoring.service";
import type { GlobalFusionExecutiveFeed, GlobalFusionExecutiveSummary } from "./global-fusion.types";

function buildFeedFromSummary(summary: GlobalFusionExecutiveSummary): GlobalFusionExecutiveFeed {
  const weakEvidenceOnly =
    summary.notes.includes("weak_monitoring_runs_executive_caution") ||
    (!!summary.disabled && summary.notes.some((n) => n.includes("weak")));

  const missingSourceDegraded =
    summary.notes.includes("missing_source_degradation") || summary.rolloutSummary.missingSourceRate > 0.35;

  const warnings: string[] = [];
  if (weakEvidenceOnly) warnings.push("weak_evidence_executive");
  if (missingSourceDegraded) warnings.push("missing_source_degraded");
  if (summary.disabled) warnings.push("executive_layer_disabled");

  return {
    summary,
    topPriorities: summary.topPriorities,
    topRisks: summary.topRisks,
    topOpportunities: summary.topOpportunities,
    rolloutSummary: summary.rolloutSummary,
    healthSummary: summary.healthSummary,
    warnings,
    provenance: summary.provenance,
    meta: {
      feedVersion: 1,
      generatedAt: summary.provenance.generatedAt,
      executiveLayerEnabled: globalFusionFlags.globalFusionExecutiveLayerV1,
      executiveFeedEnabled: globalFusionFlags.globalFusionExecutiveFeedV1,
      executivePersistenceEnabled: globalFusionFlags.globalFusionExecutivePersistenceV1,
      missingSourceDegraded,
      weakEvidenceOnly,
    },
  };
}

/**
 * Build feed when FEATURE_GLOBAL_FUSION_EXECUTIVE_FEED_V1 is on.
 * Returns null when feed flag is off (callers use summary API directly if layer-only).
 */
export async function buildGlobalFusionExecutiveFeed(opts: BuildExecutiveSummaryOpts = {}): Promise<GlobalFusionExecutiveFeed | null> {
  if (!globalFusionFlags.globalFusionExecutiveFeedV1) {
    return null;
  }
  const summary = await buildGlobalFusionExecutiveSummary(opts);
  const feed = buildFeedFromSummary(summary);
  recordExecutiveFeedEmitted();
  return feed;
}

/**
 * Same shape as feed, without requiring EXECUTIVE_FEED_V1 — for tests and internal consumers.
 */
export function wrapExecutiveSummaryAsFeed(summary: GlobalFusionExecutiveSummary): GlobalFusionExecutiveFeed {
  return buildFeedFromSummary(summary);
}
