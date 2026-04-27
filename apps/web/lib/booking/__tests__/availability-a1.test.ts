import { describe, expect, it } from "vitest";

import {
  availabilityUrgencyMessage,
  getAvailabilityUrgencyLabel,
  firstAvailableNightFrom,
  mergeBookingIntervals,
} from "@/lib/booking/availability-core";

describe("Order A.1 — safe urgency (no false scarcity)", () => {
  it("does not show urgency copy at or below 70% occupancy", () => {
    expect(availabilityUrgencyMessage(0.7)).toBeNull();
    expect(availabilityUrgencyMessage(0.5)).toBeNull();
    expect(getAvailabilityUrgencyLabel(0.7)).toBeNull();
  });

  it("high demand only above 0.7", () => {
    expect(getAvailabilityUrgencyLabel(0.7001)).toBe("high_demand");
    expect(availabilityUrgencyMessage(0.75)).toBe("High demand for this listing");
  });

  it("almost fully booked only above 0.9 (stronger than high demand)", () => {
    expect(getAvailabilityUrgencyLabel(0.91)).toBe("almost_full");
    expect(availabilityUrgencyMessage(0.95)).toBe("Almost fully booked");
  });
});

describe("Order A.1 — next available gap (overlap-safe)", () => {
  it("fully booked range leaves no first night within horizon", () => {
    const from = new Date(Date.UTC(2025, 5, 10));
    const merged = mergeBookingIntervals([
      { checkIn: from, checkOut: new Date(Date.UTC(2027, 0, 1)) },
    ]);
    const next = firstAvailableNightFrom(merged, from);
    expect(next).toBeNull();
  });

  it("partial booking — earliest gap after start", () => {
    const merged = mergeBookingIntervals([
      { checkIn: new Date("2025-06-10T00:00:00.000Z"), checkOut: new Date("2025-06-15T00:00:00.000Z") },
      { checkIn: new Date("2025-06-20T00:00:00.000Z"), checkOut: new Date("2025-06-25T00:00:00.000Z") },
    ]);
    const from = new Date("2025-06-10T00:00:00.000Z");
    const next = firstAvailableNightFrom(merged, from);
    expect(next).not.toBeNull();
    expect(next!.getUTCDate()).toBe(15);
  });
});

describe("feed ranking boost (Order A.1)", () => {
  it("applies + occupancyRate * 2 in feed score", async () => {
    const { feedScore } = await import("@/lib/ai/feedRanking");
    const { computeListingReputationFromMetrics } = await import("@/lib/ai/reputationScoringCore");
    const rep = computeListingReputationFromMetrics({
      listingId: "x",
      views: 10,
      bookings: 1,
      rating: 4,
      descriptionLength: 100,
      hasPhoto: true,
    });
    const base = feedScore(
      {
        id: "1",
        title: "T",
        city: "Mtl",
        price: 100,
        createdAt: new Date(),
        demandScore: 0,
        imageUrl: null,
        socialProofScore: 0.5,
        socialProofStrength: "low",
        listingReputationScore: rep.score,
        reputationLevel: rep.level,
        ownerId: "o",
        occupancyRate: 0,
      },
      undefined,
      { random01: () => 0 }
    );
    const withOcc = feedScore(
      {
        id: "1",
        title: "T",
        city: "Mtl",
        price: 100,
        createdAt: new Date(),
        demandScore: 0,
        imageUrl: null,
        socialProofScore: 0.5,
        socialProofStrength: "low",
        listingReputationScore: rep.score,
        reputationLevel: rep.level,
        ownerId: "o",
        occupancyRate: 0.5,
      },
      undefined,
      { random01: () => 0 }
    );
    expect(withOcc - base).toBeCloseTo(1, 5);
  });
});

describe("conversion score — high occupancy nudge (Order A.1)", () => {
  it("adds 0.1 and reason when listing occupancy > 0.7", async () => {
    const { convertSignalsToScore } = await import("@/lib/ai/conversionScoringCore");
    const s = convertSignalsToScore("lid", "uid", {
      viewsThisListing: 0,
      viewsInSameCity: 0,
      hasFeedClick: false,
      hasSearchActivity: false,
      hasSavedListing: false,
      hasBookingStarted: false,
      demandScoreForCity: 0,
      priceIncreaseRecommended: false,
      listingOccupancyRate: 0.75,
    });
    expect(s.reasons).toContain("Listing is frequently booked");
    expect(s.score).toBeGreaterThanOrEqual(0.1);
  });
});
