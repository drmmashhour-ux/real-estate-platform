import { describe, it, expect } from "vitest";
import { computeSmartPrice, seasonalityMultiplier } from "../smart-pricing";
import { computeBookingConfidence } from "../booking-confidence";

describe("seasonalityMultiplier", () => {
  it("returns sensible peak in summer", () => {
    expect(seasonalityMultiplier(7)).toBeGreaterThan(seasonalityMultiplier(1));
  });
});

describe("computeSmartPrice", () => {
  it("recommends near blend of listing and market when data is rich", () => {
    const r = computeSmartPrice({
      listingNightCents: 10_000,
      marketAvgCents: 12_000,
      peerBookingsLast30d: 20,
      peerListingCount: 20,
      month: 7,
    });
    expect(r.recommendedPriceCents).toBeGreaterThan(10_000);
    expect(r.confidence).toBe("high");
    expect(r.demandLevel).toBe("high");
    expect(r.peerListingCount).toBe(20);
    expect(r.peerBookingsLast30d).toBe(20);
  });

  it("falls back when no market average", () => {
    const r = computeSmartPrice({
      listingNightCents: 8000,
      marketAvgCents: null,
      peerBookingsLast30d: 0,
      peerListingCount: 2,
      month: 2,
    });
    expect(r.recommendedPriceCents).toBeGreaterThanOrEqual(100);
    expect(r.confidence).toBe("low");
    expect(r.peerListingCount).toBe(2);
    expect(r.peerBookingsLast30d).toBe(0);
  });
});

describe("computeBookingConfidence", () => {
  it("ranks verified + strong reviews as high", () => {
    const r = computeBookingConfidence({
      listingTrustScore0to100: 80,
      listingVerified: true,
      reviewAvg0to5: 4.8,
      reviewCount: 10,
      openFraudSignals: 0,
      hostTrustScore0to100: 70,
    });
    expect(r.level).toBe("high");
    expect(r.score).toBeGreaterThanOrEqual(72);
  });

  it("penalizes fraud signals", () => {
    const clean = computeBookingConfidence({
      listingTrustScore0to100: 70,
      listingVerified: true,
      reviewAvg0to5: 4.5,
      reviewCount: 5,
      openFraudSignals: 0,
      hostTrustScore0to100: 50,
    });
    const dirty = computeBookingConfidence({
      listingTrustScore0to100: 70,
      listingVerified: true,
      reviewAvg0to5: 4.5,
      reviewCount: 5,
      openFraudSignals: 3,
      hostTrustScore0to100: 50,
    });
    expect(dirty.score).toBeLessThan(clean.score);
  });
});
