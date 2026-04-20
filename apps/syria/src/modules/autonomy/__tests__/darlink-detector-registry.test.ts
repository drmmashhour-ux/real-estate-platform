import { describe, expect, it } from "vitest";
import { marketplaceDetectorRegistry } from "../detectors/detector-registry";

const emptySnapshot = {
  builtAt: "",
  scope: { mode: "portfolio" as const, listingId: null },
  listings: [],
  bookings: [],
  payouts: [],
  leads: [],
  aggregates: {
    totalListings: 0,
    pendingReviewListings: 0,
    featuredListings: 0,
    fraudFlaggedListings: 0,
    stalePublishedLikeCount: 0,
    totalBookings: 0,
    payoutsPending: 0,
    payoutsPaid: 0,
    inquiriesLast30d: 0,
    activeBnhubListings: 0,
  },
  trustHints: { fraudListedCount: 0, fraudBookingCount: 0 },
  rankingHints: { avgFeaturedPriority: 0 },
  growthMetrics: null,
  executionRecent: [],
  autopilotRecommendationsPending: 0,
  notes: [],
};

describe("marketplaceDetectorRegistry", () => {
  it("runs without throwing on empty snapshot", () => {
    expect(marketplaceDetectorRegistry.length).toBeGreaterThan(0);
    for (const d of marketplaceDetectorRegistry) {
      const sigs = d.run(emptySnapshot as never);
      expect(Array.isArray(sigs)).toBe(true);
    }
  });
});
