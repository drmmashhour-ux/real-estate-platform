/**
 * Tests for AI ranking score and factor breakdown.
 */
import { describe, it, expect } from "vitest";
import { computeAiRankingScore } from "@/lib/ai-ranking";
import type { ListingForRanking } from "@/lib/bnhub/search-ranking";

describe("AI Ranking", () => {
  it("adds verification contribution when verified", () => {
    const listing: ListingForRanking = {
      verificationStatus: "VERIFIED",
      owner: null,
      _count: { reviews: 0, bookings: 0 },
      reviews: [],
    };
    const { score, factors } = computeAiRankingScore(listing, { verification: 30 });
    expect(score).toBe(30);
    expect(factors.some((f) => f.factor === "verification")).toBe(true);
  });

  it("adds superHost and review score", () => {
    const listing: ListingForRanking = {
      verificationStatus: "PENDING",
      owner: { hostQuality: { qualityScore: 4.5, isSuperHost: true } },
      _count: { reviews: 5, bookings: 4 },
      reviews: [{ propertyRating: 5 }, { propertyRating: 4 }],
    };
    const { score, factors } = computeAiRankingScore(listing, {});
    expect(score).toBeGreaterThan(0);
    expect(factors.some((f) => f.factor === "superHost")).toBe(true);
    expect(factors.some((f) => f.factor === "reviewScore")).toBe(true);
  });
});
