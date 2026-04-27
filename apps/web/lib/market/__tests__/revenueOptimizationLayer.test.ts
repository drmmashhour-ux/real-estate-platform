import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { computeRevenueOptimizationMultiplier, occupancyFactor, REVENUE_FACTOR_CLAMP } from "../revenueOptimizationLayer";

describe("revenue optimization layer (Order 62)", () => {
  it("applies +12% when occupancy &gt; 0.8", () => {
    expect(occupancyFactor(0.81)).toBe(0.12);
    expect(occupancyFactor(0.8)).toBe(0);
  });

  it("clamps the sum of factors to +30% (example: all uplifts on)", () => {
    const b = computeRevenueOptimizationMultiplier({
      basePrice: 100,
      dayType: "weekend",
      seasonType: "high_season",
      demandLevel: "high",
      occupancyRatio: 0.9,
    });
    expect(b.factorSumClamped).toBe(REVENUE_FACTOR_CLAMP.max);
    expect(b.multiplier).toBe(1.3);
    expect(b.adjustmentPercentRounded).toBe(30);
  });

  it("caps negative at -10% when raw is below floor", () => {
    const b = computeRevenueOptimizationMultiplier({
      basePrice: 100,
      dayType: "weekday",
      seasonType: "low_season",
      demandLevel: "low",
      occupancyRatio: null,
    });
    expect(b.demandFactor + b.weekendFactor + b.seasonFactor + b.occupancyFactor).toBe(-0.07);
    expect(b.factorSumClamped).toBe(-0.07);
  });
});

describe("computeDailyListingPricing with FEATURE_REVENUE_OPTIMIZATION_LAYER", () => {
  const original = process.env.FEATURE_REVENUE_OPTIMIZATION_LAYER;

  beforeEach(() => {
    process.env.FEATURE_REVENUE_OPTIMIZATION_LAYER = "1";
    vi.resetModules();
  });

  afterEach(() => {
    process.env.FEATURE_REVENUE_OPTIMIZATION_LAYER = original;
  });

  it("uses revenue multiplier and +30% cap when flag on", async () => {
    const { computeDailyListingPricing: compute } = await import("../seasonalPricingMath");
    const d = compute({
      basePrice: 200,
      dateYmd: "2026-12-20",
      city: "Test",
      cityDemandScore: 100,
      occupancyRatio: 0.85,
    });
    // Sat high season, high demand, high occ → should hit +30% cap
    expect(d.suggestedPrice).toBe(260);
    expect(d.adjustmentPercent).toBe(30);
    expect(d.reason).toMatch(/Revenue layer:/);
  });
});
