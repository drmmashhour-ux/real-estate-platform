import { describe, expect, it } from "vitest";
import { suggestNightlyPrice } from "../suggestNightlyPrice";
import type { DemandScoreResult } from "../calculateDemandScore";

const baseDemand = (): DemandScoreResult => ({
  demandScore: 0.5,
  competitionScore: 0.3,
  seasonalityScore: 0.4,
});

describe("suggestNightlyPrice", () => {
  it("suggests higher price for high demand and occupancy", () => {
    const r = suggestNightlyPrice({
      currentNightly: 100,
      hostSettings: null,
      demand: { demandScore: 0.85, competitionScore: 0.2, seasonalityScore: 0.7 },
      occupancyRate: 0.6,
      bookingVelocity: 1.5,
    });
    expect(r.suggestedPrice).toBeGreaterThanOrEqual(100);
  });

  it("respects min price", () => {
    const r = suggestNightlyPrice({
      currentNightly: 80,
      hostSettings: {
        id: "x",
        hostId: "h",
        mode: "ASSIST",
        autoPricing: true,
        autoPromotions: false,
        autoListingOptimization: false,
        autoMessaging: false,
        minPrice: 95,
        maxPrice: null,
        maxDailyChangePct: 20,
        requireApprovalForPricing: true,
        requireApprovalForPromotions: true,
        paused: false,
        pauseReason: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never,
      demand: baseDemand(),
      occupancyRate: 0.1,
      bookingVelocity: 0.1,
    });
    expect(r.suggestedPrice).toBeGreaterThanOrEqual(95);
  });

  it("respects max daily change pct", () => {
    const r = suggestNightlyPrice({
      currentNightly: 100,
      hostSettings: {
        id: "x",
        hostId: "h",
        mode: "ASSIST",
        autoPricing: true,
        autoPromotions: false,
        autoListingOptimization: false,
        autoMessaging: false,
        minPrice: null,
        maxPrice: null,
        maxDailyChangePct: 5,
        requireApprovalForPricing: true,
        requireApprovalForPromotions: true,
        paused: false,
        pauseReason: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never,
      demand: { demandScore: 0.95, competitionScore: 0.1, seasonalityScore: 0.8 },
      occupancyRate: 0.8,
      bookingVelocity: 2,
    });
    const pct = Math.abs((r.suggestedPrice - 100) / 100) * 100;
    expect(pct).toBeLessThanOrEqual(5.01);
  });
});
