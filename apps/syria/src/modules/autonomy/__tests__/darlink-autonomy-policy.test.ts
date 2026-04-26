import { describe, expect, it } from "vitest";
import { evaluateMarketplacePolicy } from "../darlink-autonomy-policy.service";

describe("evaluateMarketplacePolicy", () => {
  it("blocks promotion opportunities when moderation backlog is heavy", () => {
    const snapshot = {
      builtAt: "",
      scope: { mode: "portfolio" as const, listingId: null },
      listings: [],
      bookings: [],
      payouts: [],
      leads: [],
      aggregates: {
        totalListings: 100,
        pendingReviewListings: 10,
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

    const opportunities = [
      {
        id: "opp1",
        type: "promote_high_trust_listing" as const,
        sourceSignalTypes: ["high_interest" as const],
        entityType: "listing" as const,
        entityId: "p1",
        title: "t",
        rationale: "r",
        priority: 10,
      },
    ];

    const out = evaluateMarketplacePolicy({
      snapshot,
      signals: [],
      opportunities,
    });

    expect(out.opportunityOutcomes["opp1"]?.outcome).toBe("blocked");
  });
});
