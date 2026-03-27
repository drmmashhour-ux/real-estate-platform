/**
 * Unit tests for search ranking score logic.
 * Run with: npx vitest run lib/bnhub/__tests__/search-ranking.test.ts
 */
import { describe, it, expect } from "vitest";
import { computeListingRankScore } from "../search-ranking";

describe("computeListingRankScore", () => {
  const defaultWeights = {
    verification: 30,
    superHost: 25,
    hostQualityScore: 5,
    reviewScore: 4,
    reviewCount: 1.5,
    conversion: 3,
  };

  it("gives verified listing verification weight", () => {
    const a = {
      verificationStatus: "PENDING",
      _count: { reviews: 0, bookings: 0 },
      reviews: [],
    };
    const b = {
      ...a,
      verificationStatus: "VERIFIED",
    };
    expect(computeListingRankScore(b, defaultWeights)).toBe(
      defaultWeights.verification
    );
    expect(computeListingRankScore(a, defaultWeights)).toBe(0);
  });

  it("adds Super Host weight when isSuperHost", () => {
    const listing = {
      verificationStatus: "VERIFIED",
      owner: { hostQuality: { qualityScore: 4.9, isSuperHost: true } },
      _count: { reviews: 5, bookings: 4 },
      reviews: [{ propertyRating: 5 }, { propertyRating: 5 }],
    };
    const score = computeListingRankScore(listing, defaultWeights);
    expect(score).toBeGreaterThanOrEqual(
      defaultWeights.verification + defaultWeights.superHost
    );
  });

  it("uses custom weights when provided", () => {
    const listing = {
      verificationStatus: "VERIFIED",
      owner: null,
      _count: { reviews: 0, bookings: 0 },
      reviews: [],
    };
    const customWeights = { ...defaultWeights, verification: 50 };
    expect(computeListingRankScore(listing, customWeights)).toBe(50);
  });

  it("incorporates review score and count", () => {
    const listing = {
      verificationStatus: "PENDING",
      owner: null,
      _count: { reviews: 10, bookings: 8 },
      reviews: [
        { propertyRating: 5 },
        { propertyRating: 4 },
        { propertyRating: 5 },
      ],
    };
    const score = computeListingRankScore(listing, defaultWeights);
    const expectedRating = (5 + 4 + 5) / 3;
    expect(score).toBeGreaterThanOrEqual(
      expectedRating * defaultWeights.reviewScore
    );
  });
});
