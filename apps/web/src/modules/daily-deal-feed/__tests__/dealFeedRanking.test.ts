import { describe, expect, it } from "vitest";
import { rankDailyDeals } from "@/src/modules/daily-deal-feed/infrastructure/dealFeedRankingService";
import { assignFeedBucket } from "@/src/modules/daily-deal-feed/infrastructure/dealFeedGroupingService";

function candidate(overrides: Partial<any> = {}) {
  return {
    listingId: "l1",
    title: "Listing",
    city: "Montreal",
    propertyType: "CONDO",
    listingMode: "SALE",
    priceCents: 50000000,
    imageUrl: null,
    dealScore: 80,
    trustScore: 75,
    riskScore: 25,
    confidence: 80,
    freshnessDays: 1,
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("daily feed ranking", () => {
  it("orders higher score first", () => {
    const out = rankDailyDeals({
      candidates: [candidate({ listingId: "a", dealScore: 60 }), candidate({ listingId: "b", dealScore: 90 })],
      preferences: null,
      interactions: [],
    });
    expect(out[0].listingId).toBe("b");
  });

  it("demotes low confidence", () => {
    const out = rankDailyDeals({
      candidates: [candidate({ listingId: "a", confidence: 25 }), candidate({ listingId: "b", confidence: 85 })],
      preferences: null,
      interactions: [],
    });
    expect(out[0].listingId).toBe("b");
  });

  it("demotes high risk", () => {
    const out = rankDailyDeals({
      candidates: [candidate({ listingId: "a", riskScore: 90 }), candidate({ listingId: "b", riskScore: 20 })],
      preferences: null,
      interactions: [],
    });
    expect(out[0].listingId).toBe("b");
  });

  it("reduces stale ranking", () => {
    const out = rankDailyDeals({
      candidates: [candidate({ listingId: "a", freshnessDays: 20 }), candidate({ listingId: "b", freshnessDays: 1 })],
      preferences: null,
      interactions: [],
    });
    expect(out[0].listingId).toBe("b");
  });

  it("uses preference matching", () => {
    const out = rankDailyDeals({
      candidates: [candidate({ listingId: "a", city: "Toronto" }), candidate({ listingId: "b", city: "Montreal" })],
      preferences: {
        userId: "u1",
        preferredCities: ["Montreal"],
        preferredPropertyTypes: [],
        preferredModes: [],
        budgetMin: null,
        budgetMax: null,
        strategyMode: "balanced",
        riskTolerance: "medium",
      },
      interactions: [],
    });
    expect(out[0].listingId).toBe("b");
  });

  it("bucket assignment is deterministic", () => {
    expect(assignFeedBucket({ ...candidate(), score: 85, confidence: 80, isNewToUser: true } as any)).toBe("top_opportunities");
    expect(assignFeedBucket({ ...candidate(), listingMode: "RENT_SHORT" } as any)).toBe("bnhub_candidates");
    expect(assignFeedBucket({ ...candidate(), riskScore: 78 } as any)).toBe("risky_watchouts");
  });
});
