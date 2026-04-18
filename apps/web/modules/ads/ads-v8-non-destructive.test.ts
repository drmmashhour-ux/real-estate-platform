import { describe, expect, it } from "vitest";
import {
  buildV8CampaignDiagnostic,
  buildV8ShadowBidBudgetRecommendation,
  detectV8AdsAnomalies,
  scoreV8AdsQuality,
} from "./ads-v8-non-destructive.service";
import { sanitizeCampaignAdsMetrics } from "./ads-v8-non-destructive-inputs";
import { buildV8NonDestructiveRunStats, capAnomalySignals } from "./ads-v8-non-destructive-monitoring";
import type { CampaignAdsMetrics } from "./ads-performance.service";

function cm(partial: Partial<CampaignAdsMetrics> & Pick<CampaignAdsMetrics, "campaignKey">): CampaignAdsMetrics {
  return {
    impressions: 0,
    clicks: 0,
    leads: 0,
    bookingsCompleted: 0,
    estimatedSpend: 0,
    ctrPercent: null,
    cpl: null,
    conversionRatePercent: null,
    ...partial,
  };
}

describe("ads-v8-non-destructive", () => {
  it("buildV8CampaignDiagnostic does not throw and labels insufficient volume", () => {
    const d = buildV8CampaignDiagnostic(cm({ campaignKey: "a" }));
    expect(d.bucket).toBe("insufficient_volume");
  });

  it("detectV8AdsAnomalies flags low sample", () => {
    const a = detectV8AdsAnomalies([cm({ campaignKey: "x", impressions: 10, clicks: 2, leads: 1, bookingsCompleted: 0 })]);
    expect(a.some((x) => x.kind === "low_sample")).toBe(true);
  });

  it("shadow budget recommendation stays manual-only", () => {
    const r = buildV8ShadowBidBudgetRecommendation(
      cm({
        campaignKey: "w",
        impressions: 2000,
        clicks: 80,
        leads: 12,
        bookingsCompleted: 3,
        ctrPercent: 4,
        cpl: 40,
        conversionRatePercent: 4,
      }),
    );
    expect(r.safety.manualOnly).toBe(true);
    expect(r.safety.neverAutoApply).toBe(true);
    expect(Math.abs(r.suggestedDailyBudgetDeltaPct ?? 0)).toBeLessThanOrEqual(15);
  });

  it("scoreV8AdsQuality returns bounded score", () => {
    const s = scoreV8AdsQuality(
      cm({
        campaignKey: "q",
        impressions: 500,
        clicks: 40,
        leads: 5,
        bookingsCompleted: 1,
        ctrPercent: 8,
        conversionRatePercent: 5,
      }),
    );
    expect(s.score).toBeGreaterThanOrEqual(0);
    expect(s.score).toBeLessThanOrEqual(100);
  });

  it("scoreV8AdsQuality handles non-finite inputs safely", () => {
    const s = scoreV8AdsQuality(
      cm({
        campaignKey: "nan",
        impressions: 100,
        clicks: 10,
        leads: 1,
        bookingsCompleted: 0,
        ctrPercent: Number.NaN,
        conversionRatePercent: null,
      }),
    );
    expect(Number.isFinite(s.score)).toBe(true);
    expect(s.score).toBeGreaterThanOrEqual(0);
    expect(s.score).toBeLessThanOrEqual(100);
  });

  it("sanitizeCampaignAdsMetrics coerces invalid rows", () => {
    const s = sanitizeCampaignAdsMetrics({
      campaignKey: "",
      impressions: -1,
      clicks: Number.NaN,
      leads: 0,
      bookingsCompleted: 0,
      estimatedSpend: 0,
      ctrPercent: null,
      cpl: null,
      conversionRatePercent: null,
    } as CampaignAdsMetrics);
    expect(s.campaignKey).toBe("(unknown_campaign)");
    expect(s.impressions).toBe(0);
    expect(s.clicks).toBe(0);
  });

  it("capAnomalySignals limits volume", () => {
    const many = Array.from({ length: 100 }, (_, i) => ({
      campaignKey: `c${i}`,
      kind: "low_sample" as const,
      severity: "info" as const,
      message: "x",
    }));
    expect(capAnomalySignals(many, 72).length).toBe(72);
  });

  it("buildV8NonDestructiveRunStats produces summary fields", () => {
    const diagnostics = [buildV8CampaignDiagnostic(cm({ campaignKey: "a", impressions: 0 }))];
    const stats = buildV8NonDestructiveRunStats({
      campaignsAnalyzed: 1,
      diagnostics,
      anomalies: [],
      qualityByCampaign: [{ campaignKey: "a", ...scoreV8AdsQuality(cm({ campaignKey: "a" })) }],
      shadowBidBudget: [buildV8ShadowBidBudgetRecommendation(cm({ campaignKey: "a" }))],
      alerts: [],
    });
    expect(stats.campaignsAnalyzed).toBe(1);
    expect(Number.isFinite(stats.avgQualityScore)).toBe(true);
    expect(stats.observationalWarnings.length).toBeGreaterThanOrEqual(0);
  });
});
