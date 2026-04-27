import { describe, expect, it } from "vitest";
import { derivePerformanceMetrics } from "@/lib/marketing/campaignEnginePure";
import { computeOptimizationRecommendation } from "@/lib/marketing/campaignOptimizerRules";

describe("Order 86 — campaign performance metrics", () => {
  it("derives rates from impressions/clicks/spend; spendCents = round(dollars*100)", () => {
    const d = derivePerformanceMetrics({
      impressions: 2000,
      clicks: 100,
      conversions: 10,
      spend: 48.5,
    });
    const spendCents = Math.max(0, Math.round(48.5 * 100));
    expect(spendCents).toBe(4850);
    expect(d.ctr).toBeCloseTo(0.05, 5);
    expect(d.conversionRate).toBeCloseTo(0.1, 5);
    expect(d.costPerConversion).toBeCloseTo(4.85, 5);
  });
});

describe("Order 86 — optimizer rules", () => {
  it("recommends scale when conversions and efficiency are strong", () => {
    const r = computeOptimizationRecommendation({
      impressions: 5000,
      clicks: 500,
      conversions: 12,
      spend: 200,
      ctr: 0.1,
      conversionRate: 0.024,
      costPerConversion: 16.67,
    });
    expect(r.recommendation).toBe("scale_budget");
  });

  it("recommends pause when spend is high and zero conversions", () => {
    const r = computeOptimizationRecommendation({
      impressions: 5000,
      clicks: 200,
      conversions: 0,
      spend: 120,
      ctr: 0.04,
      conversionRate: 0,
      costPerConversion: null,
    });
    expect(r.recommendation).toBe("pause_campaign");
  });

  it("recommends improve_copy when ctr below 1.5%", () => {
    const r = computeOptimizationRecommendation({
      impressions: 10000,
      clicks: 100,
      conversions: 2,
      spend: 40,
      ctr: 0.01,
      conversionRate: 0.02,
      costPerConversion: 20,
    });
    expect(r.recommendation).toBe("improve_copy");
  });
});
