import { describe, expect, it } from "vitest";
import { computeBudgetMatch, computeCareMatch, sourceQualityScore } from "../lead-features.service";
import { bandFromScore, computeLeadScoreNumber } from "../lead-scoring.service";

describe("lead-features", () => {
  it("returns high budget match when budget in range", () => {
    const s = computeBudgetMatch(4500, {
      basePrice: 4000,
      priceRangeMin: 4000,
      priceRangeMax: 5000,
    });
    expect(s).toBeGreaterThanOrEqual(90);
  });

  it("returns lower budget match when below range", () => {
    const s = computeBudgetMatch(2000, {
      basePrice: 4000,
      priceRangeMin: 4000,
      priceRangeMax: 5000,
    });
    expect(s).toBeLessThan(50);
  });

  it("care match higher when residence tier meets needs", () => {
    expect(computeCareMatch("ASSISTED", "HIGH")).toBeGreaterThan(computeCareMatch("AUTONOMOUS", "HIGH"));
  });

  it("source quality prefers referral", () => {
    expect(sourceQualityScore("referral")).toBeGreaterThan(sourceQualityScore("paid_search"));
  });
});

describe("lead-scoring bands and formula", () => {
  it("classifies bands", () => {
    expect(bandFromScore(80)).toBe("HIGH");
    expect(bandFromScore(50)).toBe("MEDIUM");
    expect(bandFromScore(30)).toBe("LOW");
  });

  it("high engagement features produce higher combined score than weak", () => {
    const weights = {
      wEngagement: 0.25,
      wBudget: 0.25,
      wCare: 0.25,
      wIntent: 0.15,
      wSource: 0.1,
    };
    const strong = computeLeadScoreNumber(
      {
        timeOnPlatform: 25,
        pagesViewed: 5,
        interactions: 8,
        budgetMatch: 95,
        careMatch: 88,
        voiceUsed: true,
        clickedBestMatch: true,
        deviceType: null,
        source: "referral",
        engagementScore: 92,
        intentSignalsScore: 90,
        sourceQualityScore: 88,
      },
      weights
    );
    const weak = computeLeadScoreNumber(
      {
        timeOnPlatform: 0,
        pagesViewed: 0,
        interactions: 0,
        budgetMatch: 45,
        careMatch: 40,
        voiceUsed: false,
        clickedBestMatch: false,
        deviceType: null,
        source: null,
        engagementScore: 35,
        intentSignalsScore: 30,
        sourceQualityScore: 58,
      },
      weights
    );
    expect(strong).toBeGreaterThan(weak + 15);
  });
});
