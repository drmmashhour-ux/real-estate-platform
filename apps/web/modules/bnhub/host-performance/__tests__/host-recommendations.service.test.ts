import { describe, expect, it } from "vitest";
import { buildHostListingRecommendations } from "../host-recommendations.service";

describe("buildHostListingRecommendations", () => {
  it("suggests photos when below threshold", () => {
    const recs = buildHostListingRecommendations(
      {
        listingId: "l1",
        description: "x".repeat(100),
        amenities: [],
        photos: [],
        updatedAt: new Date(),
      },
      {
        trustScore: 15,
        freshnessScore: 10,
        priceCompetitivenessScore: 15,
        conversionScore: 15,
        qualityScore: 10,
      },
    );
    expect(recs.some((r) => r.category === "photos")).toBe(true);
  });

  it("includes pricing hint when price score weak", () => {
    const recs = buildHostListingRecommendations(
      {
        listingId: "l2",
        description: "ok description length for test purposes here",
        amenities: ["wifi", "kitchen", "parking"],
        photos: ["a", "b", "c"],
        updatedAt: new Date(),
      },
      { priceCompetitivenessScore: 8 },
    );
    expect(recs.some((r) => r.category === "pricing")).toBe(true);
  });
});
