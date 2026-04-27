import { describe, expect, it } from "vitest";

import { computeOptimizationRecommendation } from "../campaignOptimizerRules";

describe("Order 39 — optimization rules (simulation)", () => {
  it("scale_budget when 10+ conversions and cost/conv <= 20", () => {
    const r = computeOptimizationRecommendation({
      impressions: 50_000,
      clicks: 2_000,
      conversions: 10,
      spend: 100,
      ctr: 0.04,
      conversionRate: 0.2,
      costPerConversion: 10,
    });
    expect(r.recommendation).toBe("scale_budget");
  });

  it("pause_campaign when spend >= 100 and zero conversions", () => {
    const r = computeOptimizationRecommendation({
      impressions: 20_000,
      clicks: 400,
      conversions: 0,
      spend: 120,
      ctr: 0.02,
      conversionRate: 0,
      costPerConversion: null,
    });
    expect(r.recommendation).toBe("pause_campaign");
  });

  it("improve_copy when ctr < 0.015 (1.5%)", () => {
    const r = computeOptimizationRecommendation({
      impressions: 10_000,
      clicks: 100,
      conversions: 2,
      spend: 40,
      ctr: 0.01,
      conversionRate: 0.02,
      costPerConversion: 20,
    });
    expect(r.recommendation).toBe("improve_copy");
  });

  it("keep_running in normal band", () => {
    const r = computeOptimizationRecommendation({
      impressions: 8_000,
      clicks: 200,
      conversions: 4,
      spend: 60,
      ctr: 0.025,
      conversionRate: 0.02,
      costPerConversion: 15,
    });
    expect(r.recommendation).toBe("keep_running");
  });

  it("no data → keep_running with no-performance reason", () => {
    const r = computeOptimizationRecommendation(null);
    expect(r.recommendation).toBe("keep_running");
  });
});
