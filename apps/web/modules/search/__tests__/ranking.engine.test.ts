import { describe, expect, it } from "vitest";
import type { RankableListingInput } from "@/lib/marketplace-ranking/ranking-algorithm.engine";
import { rankListings, toPublicFactorBreakdown } from "../ranking.engine";
import type { ListingRankingBreakdown } from "@/lib/marketplace-ranking/ranking.types";

describe("rankListings", () => {
  it("sorts by total score and assigns positions", () => {
    const hi: RankableListingInput = {
      id: "1",
      nightPriceCents: 10_000,
      listingStatus: "PUBLISHED",
      city: "Montreal",
      title: "Great stay",
      description: "x".repeat(200),
      photos: ["a", "b", "c", "d"],
      amenities: ["wifi", "kitchen", "parking"],
      bnhubListingRatingAverage: 4.9,
      bnhubListingReviewCount: 40,
      bnhubListingCompletedStays: 12,
      _count: { reviews: 20, bookings: 30 },
      reviews: [{ propertyRating: 5 }],
      createdAt: new Date(Date.now() - 86400000),
    };
    const lo: RankableListingInput = {
      id: "2",
      nightPriceCents: 50_000,
      listingStatus: "PUBLISHED",
      city: "Montreal",
      title: "Ok",
      description: "short",
      photos: [],
      amenities: [],
      bnhubListingRatingAverage: 3.2,
      bnhubListingReviewCount: 1,
      bnhubListingCompletedStays: 0,
      _count: { reviews: 1, bookings: 1 },
      reviews: [{ propertyRating: 3 }],
      createdAt: new Date(Date.now() - 86400000 * 400),
    };

    const { listings } = rankListings([lo, hi], {
      city: "Montreal",
      sortIntent: "RELEVANCE",
    });

    expect(listings[0].id).toBe("1");
    expect(listings[0]._rankingPosition).toBe(1);
    expect(listings[0]._listingScore).toBeGreaterThan(listings[1]._listingScore);
  });
});

describe("toPublicFactorBreakdown", () => {
  it("maps signals to public factor names", () => {
    const br = {
      weightsVersion: "t",
      weightedSubtotal: 0.5,
      personalizationBoost: 0,
      penaltyMultiplier: 1,
      penalties: [],
      premiumAdditive: 0,
      totalScore: 50,
      relevanceComposite: 0.5,
      explain: [],
      excluded: false,
      signals: {
        listingId: "x",
        priceFitScore: 0.8,
        locationFitScore: 0.7,
        propertyMatchScore: 0.6,
        freshnessScore: 0.5,
        qualityScore: 0.7,
        trustScore: 0.75,
        engagementScore: 0.4,
        responseSpeedScore: 0.6,
        closeProbabilityScore: 0.55,
        bookingProbabilityScore: 0.5,
        esgBonusScore: 0,
        premiumBoostScore: 0,
      },
    } satisfies ListingRankingBreakdown;
    const f = toPublicFactorBreakdown(br);
    expect(f.priceCompetitiveness).toBe(0.8);
    expect(f.listingQuality).toBe(0.7);
    expect(f.reviewsAndTrust).toBe(0.75);
  });
});
