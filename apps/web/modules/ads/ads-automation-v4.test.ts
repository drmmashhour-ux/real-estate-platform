import { describe, it, expect } from "vitest";
import {
  computeEvidenceScore,
  classifyEvidenceQuality,
} from "./ads-evidence-score.service";
import {
  classifyCampaignPerformance,
  classifyCampaignPerformanceWithEvidence,
} from "./ads-learning-classifier.service";
import { extractGeoPerformanceSlices, buildGeoReallocationHints } from "./ads-geo-learning.service";
import type { GeoLearningSummary } from "./ads-automation-v4.types";
import { analyzeLandingFeedbackLoop } from "./landing-feedback-loop.service";
import { DEFAULT_ADS_SCALING_THRESHOLDS } from "./ads-performance.service";
import type { CampaignAdsMetrics } from "./ads-performance.service";

describe("ads-evidence-score", () => {
  it("strong data scores higher than sparse data", () => {
    const strong = computeEvidenceScore({
      impressions: 5000,
      clicks: 200,
      leads: 12,
      spendKnown: true,
      cplComputable: true,
      conversionComputable: true,
      classification: "winner",
      geoCoverageCount: 2,
      windowDays: 14,
    });
    const sparse = computeEvidenceScore({
      impressions: 40,
      clicks: 4,
      leads: 0,
      spendKnown: false,
      cplComputable: false,
      conversionComputable: false,
      classification: "uncertain",
      windowDays: 14,
    });
    expect(strong).toBeGreaterThan(sparse);
    expect(classifyEvidenceQuality(sparse)).toBe("LOW");
  });

  it("missing spend penalizes score", () => {
    const noSpend = computeEvidenceScore({
      impressions: 800,
      clicks: 60,
      leads: 4,
      spendKnown: false,
      cplComputable: false,
      conversionComputable: true,
      classification: "weak",
      windowDays: 14,
    });
    const withSpend = computeEvidenceScore({
      impressions: 800,
      clicks: 60,
      leads: 4,
      spendKnown: true,
      cplComputable: true,
      conversionComputable: true,
      classification: "weak",
      windowDays: 14,
    });
    expect(withSpend).toBeGreaterThan(noSpend);
  });
});

describe("classifyCampaignPerformanceWithEvidence", () => {
  it("matches base bucket labels for each campaign", async () => {
    const campaigns: CampaignAdsMetrics[] = [
      {
        campaignKey: "winner_like",
        impressions: 2000,
        clicks: 80,
        leads: 4,
        bookingsCompleted: 2,
        estimatedSpend: 200,
        ctrPercent: 4,
        cpl: 50,
        conversionRatePercent: 2.5,
      },
      {
        campaignKey: "weak_like",
        impressions: 800,
        clicks: 4,
        leads: 0,
        bookingsCompleted: 0,
        estimatedSpend: 0,
        ctrPercent: 0.5,
        cpl: null,
        conversionRatePercent: 0,
      },
    ];
    const buckets = classifyCampaignPerformance(campaigns, DEFAULT_ADS_SCALING_THRESHOLDS);
    const withEv = await classifyCampaignPerformanceWithEvidence(campaigns, buckets, DEFAULT_ADS_SCALING_THRESHOLDS, {
      rangeDays: 14,
      geoLearningEnabled: false,
    });
    expect(withEv.length).toBe(campaigns.length);
    for (const e of withEv) {
      const inWin = buckets.winnerCampaigns.some((c) => c.campaignKey === e.campaign.campaignKey);
      const inWeak = buckets.weakCampaigns.some((c) => c.campaignKey === e.campaign.campaignKey);
      const expected = inWin ? "winner" : inWeak ? "weak" : "uncertain";
      expect(e.classification).toBe(expected);
    }
  });
});

describe("ads-geo-learning", () => {
  it("extractGeoPerformanceSlices maps rows", () => {
    const slices = extractGeoPerformanceSlices([
      { country: "CA", city: "MTL", impressions: 100, clicks: 10, leads: 1, bookings: 0 },
    ]);
    expect(slices[0]?.label).toContain("MTL");
    expect(slices[0]?.ctr).toBeGreaterThan(0);
  });

  it("buildGeoReallocationHints is safe when geo unavailable", () => {
    const summary: GeoLearningSummary = { available: false, reason: "geo_data_unavailable", slices: [] };
    const hints = buildGeoReallocationHints(summary);
    expect(hints.length).toBeGreaterThan(0);
    expect(hints[0]?.safe).toBe(true);
  });
});

describe("landing-feedback-loop", () => {
  it("flags insufficient_data for very low views", () => {
    const out = analyzeLandingFeedbackLoop({ impressions: 10, clicks: 1, leads: 0, bookingsCompleted: 0 });
    expect(out[0]?.issueType).toBe("insufficient_data");
    expect(out[0]?.evidenceScore).toBeGreaterThanOrEqual(0);
  });
});
