import { describe, expect, it } from "vitest";
import { rankDailyDeals } from "@/src/modules/daily-deal-feed/infrastructure/dealFeedRankingService";

describe("fallback feed generation", () => {
  it("still ranks items without preferences/history", () => {
    const out = rankDailyDeals({
      candidates: [
        {
          listingId: "x1",
          title: "x",
          city: "Montreal",
          propertyType: null,
          listingMode: "SALE",
          priceCents: 100,
          imageUrl: null,
          dealScore: 45,
          trustScore: 40,
          riskScore: 55,
          confidence: 40,
          freshnessDays: 10,
          updatedAt: new Date(),
        },
      ],
      preferences: null,
      interactions: [],
    });
    expect(out).toHaveLength(1);
    expect(out[0].score).toBeGreaterThanOrEqual(0);
  });
});
