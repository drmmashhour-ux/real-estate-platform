/**
 * Rule-based winner / weak / uncertain classification — auditable thresholds.
 * No external APIs; uses same guardrails as `detectWinningCampaigns`.
 */

import {
  DEFAULT_ADS_SCALING_THRESHOLDS,
  detectWinningCampaigns,
  type AdsScalingThresholds,
  type CampaignAdsMetrics,
} from "./ads-performance.service";
import type { AdsClassification, EvidenceQuality, GeoLearningSummary, MetricsSnapshot } from "./ads-automation-v4.types";
import { classifyEvidenceQuality, computeEvidenceScore } from "./ads-evidence-score.service";
import { summarizeGeoSignalsForCampaign } from "./ads-geo-learning.service";

export type ClassifiedAdsBuckets = {
  /** Passes CTR, CPL (when known), and downstream conversion vs thresholds. */
  winnerCampaigns: CampaignAdsMetrics[];
  /** Low CTR, high CPL, or otherwise flagged weak — review or pause in Ads UI manually. */
  weakCampaigns: CampaignAdsMetrics[];
  /** Mixed or low volume — needs more data before scaling or pausing. */
  uncertainCampaigns: CampaignAdsMetrics[];
};

/**
 * WINNER: CTR ≥ winnerCtrMin, CPL ≤ winnerCplMax (or unknown), conversion ≥ winnerConversionMin.
 * WEAK: CTR < loserCtrMax OR CPL ≥ loserCplMin when spend/leads known.
 * UNCERTAIN: everything else with non-zero volume.
 */
export function classifyCampaignPerformance(
  campaigns: CampaignAdsMetrics[],
  thresholds: AdsScalingThresholds = DEFAULT_ADS_SCALING_THRESHOLDS,
): ClassifiedAdsBuckets {
  const { winners, losers, neutral } = detectWinningCampaigns(campaigns, thresholds);
  return {
    winnerCampaigns: winners,
    weakCampaigns: losers,
    uncertainCampaigns: neutral,
  };
}

export type CampaignClassificationWithEvidence = {
  campaign: CampaignAdsMetrics;
  classification: AdsClassification;
  /** Heuristic 0–1 — higher when volume + attribution support the bucket. */
  confidence: number;
  evidenceScore: number;
  evidenceQuality: EvidenceQuality;
  reasons: string[];
  warnings: string[];
  missingData: string[];
  metricsSnapshot: MetricsSnapshot;
  geoSummary?: GeoLearningSummary | null;
};

function campaignConfidence(evidenceScore: number, classification: AdsClassification): number {
  const base = 0.32 + evidenceScore * 0.55;
  const adj = classification === "uncertain" ? -0.06 : 0.04;
  return Math.max(0.15, Math.min(0.92, base + adj));
}

/**
 * Wraps {@link classifyCampaignPerformance} output with reliability scoring — does not change winner/weak/uncertain buckets.
 */
export async function classifyCampaignPerformanceWithEvidence(
  campaigns: CampaignAdsMetrics[],
  buckets: ClassifiedAdsBuckets,
  thresholds: AdsScalingThresholds,
  opts: { rangeDays: number; geoLearningEnabled?: boolean },
): Promise<CampaignClassificationWithEvidence[]> {
  void thresholds;
  const winSet = new Set(buckets.winnerCampaigns.map((c) => c.campaignKey));
  const weakSet = new Set(buckets.weakCampaigns.map((c) => c.campaignKey));

  const results: CampaignClassificationWithEvidence[] = [];
  for (const c of campaigns) {
    const classification: AdsClassification = winSet.has(c.campaignKey)
      ? "winner"
      : weakSet.has(c.campaignKey)
        ? "weak"
        : "uncertain";

    const spendKnown = c.estimatedSpend > 0;
    const cplComputable = c.cpl != null;
    const conversionComputable =
      c.conversionRatePercent != null && (c.bookingsCompleted > 0 || c.clicks >= 5);

    let geoSummary: GeoLearningSummary | null = null;
    let geoCoverageCount = 0;
    if (opts.geoLearningEnabled) {
      geoSummary = await summarizeGeoSignalsForCampaign(c.campaignKey, opts.rangeDays);
      geoCoverageCount = geoSummary.available ? Math.max(1, geoSummary.slices.length) : 0;
    }

    const evidenceScore = computeEvidenceScore({
      impressions: c.impressions,
      clicks: c.clicks,
      leads: c.leads,
      spendKnown,
      cplComputable,
      conversionComputable,
      classification,
      geoCoverageCount,
      windowDays: opts.rangeDays,
    });

    const evidenceQuality = classifyEvidenceQuality(evidenceScore);

    const missingData: string[] = [];
    if (!spendKnown) missingData.push("manual_spend_not_attributed");
    if (c.cpl == null && c.leads > 0) missingData.push("cpl_unknown_without_spend");
    if (c.impressions < 30) missingData.push("low_impressions");
    if (opts.geoLearningEnabled && !geoSummary?.available) missingData.push("geo_not_in_events");

    const warnings: string[] = [];
    if (c.impressions < 80) warnings.push("Low landing views — bucket may change as volume grows.");
    if (classification === "weak" && !spendKnown && c.clicks < 40) {
      warnings.push("Weak classification with thin traffic — confirm in ad network before pausing.");
    }

    const reasons: string[] = [
      `Bucket: ${classification} (rule-based thresholds).`,
      `CTR ${c.ctrPercent ?? "—"}%, CPL ${c.cpl ?? "—"}, conversion ${c.conversionRatePercent ?? "—"}%.`,
    ];
    if (evidenceQuality === "LOW") {
      reasons.push("Evidence reliability is low — use as a hint, not a verdict.");
    }

    const metricsSnapshot: MetricsSnapshot = {
      impressions: c.impressions,
      clicks: c.clicks,
      leads: c.leads,
      bookingsStarted: 0,
      bookingsCompleted: c.bookingsCompleted,
      spend: spendKnown ? c.estimatedSpend : null,
      ctrPercent: c.ctrPercent,
      cpl: c.cpl,
      conversionRatePercent: c.conversionRatePercent,
    };

    results.push({
      campaign: c,
      classification,
      confidence: campaignConfidence(evidenceScore, classification),
      evidenceScore,
      evidenceQuality,
      reasons,
      warnings,
      missingData,
      metricsSnapshot,
      geoSummary,
    });
  }

  return results;
}

export { DEFAULT_ADS_SCALING_THRESHOLDS, type AdsScalingThresholds };
