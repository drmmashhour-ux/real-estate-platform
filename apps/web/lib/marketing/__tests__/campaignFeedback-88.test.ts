import { describe, expect, it } from "vitest";
import { generateAdCopy } from "@/lib/marketing/adCopyEngine";
import { aggregateCampaignFeedbackFromRows } from "@/lib/marketing/campaignFeedbackPure";
import type { CampaignFeedbackInsights } from "@/lib/marketing/campaignFeedbackTypes";

describe("Order 88 — aggregate feedback rows", () => {
  it("no rows → not eligible, null bests", () => {
    const s = aggregateCampaignFeedbackFromRows([]);
    expect(s.campaignsAnalyzed).toBe(0);
    expect(s.eligible).toBe(false);
    expect(s.bestPlatform).toBeNull();
  });

  it("3+ campaigns with high ctr/cvr → eligible best platform", () => {
    const rows = [
      { platform: "meta", audience: "host", city: "M", ctr: 0.02, conversionRate: 0.04, conversions: 1 },
      { platform: "meta", audience: "host", city: "M", ctr: 0.02, conversionRate: 0.04, conversions: 1 },
      { platform: "tiktok", audience: "host", city: "M", ctr: 0.10, conversionRate: 0.1, conversions: 4 },
    ];
    const s = aggregateCampaignFeedbackFromRows(rows);
    expect(s.eligible).toBe(true);
    expect(s.bestPlatform).toBe("tiktok");
  });

  it("3 weak ctr rows → weak audience signal may still have best by relative values", () => {
    const rows = [
      { platform: "google", audience: "buyer", city: null, ctr: 0.01, conversionRate: 0.01, conversions: 0 },
      { platform: "google", audience: "buyer", city: null, ctr: 0.01, conversionRate: 0.01, conversions: 0 },
      { platform: "google", audience: "buyer", city: null, ctr: 0.01, conversionRate: 0.01, conversions: 0 },
    ];
    const s = aggregateCampaignFeedbackFromRows(rows);
    expect(s.eligible).toBe(true);
    expect(s.bestPlatform).toBe("google");
  });
});

describe("Order 88 — ad copy with feedback", () => {
  const highInsights: CampaignFeedbackInsights = {
    bestPlatform: "tiktok",
    bestAudience: "host",
    bestCity: "Montreal",
    avgCtr: 0.04,
    avgConversionRate: 0.06,
    recommendation: "test",
    campaignsAnalyzed: 5,
    eligible: true,
  };

  it("adds learnedVariant and preserves root headline (original)", () => {
    const a = generateAdCopy({ audience: "host", city: "Montreal", feedbackInsights: highInsights });
    expect(a.originalCopy.headline).toBe(a.headline);
    expect(a.learnedVariant?.platform).toBe("tiktok");
    expect(a.learnedVariant?.reason).toBe("Optimized based on past performance");
    expect(a.learnedVariant?.headline).toContain("Stop scrolling");
  });

  it("not eligible → no learnedVariant", () => {
    const low: CampaignFeedbackInsights = {
      ...highInsights,
      eligible: false,
      bestPlatform: null,
      bestAudience: null,
      bestCity: null,
    };
    const a = generateAdCopy({ audience: "host", feedbackInsights: low });
    expect(a.learnedVariant).toBeUndefined();
  });
});
