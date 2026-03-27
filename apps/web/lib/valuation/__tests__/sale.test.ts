import { describe, it, expect, vi } from "vitest";
import { computeSaleValuation } from "../sale";

vi.mock("@/lib/db", () => ({
  prisma: {
    shortTermListing: {
      findMany: vi.fn().mockResolvedValue([
        {
          id: "l1",
          nightPriceCents: 15000,
          city: "Montreal",
          beds: 2,
          baths: 1,
          latitude: 45.5,
          longitude: -73.5,
          listingStatus: "PUBLISHED",
        },
        {
          id: "l2",
          nightPriceCents: 18000,
          city: "Montreal",
          beds: 2,
          baths: 2,
          latitude: 45.51,
          longitude: -73.51,
          listingStatus: "PUBLISHED",
        },
      ]),
    },
  },
}));

describe("computeSaleValuation", () => {
  it("returns sale result with value range and confidence", async () => {
    const input = {
      propertyIdentityId: "pid",
      address: "123 Main St",
      city: "Montreal",
      province: "QC",
      bedrooms: 2,
      bathrooms: 1,
      latitude: 45.5,
      longitude: -73.5,
    };
    const result = await computeSaleValuation(input);
    expect(result.valuationType).toBe("sale");
    expect(result.estimatedValueCents).toBeGreaterThan(0);
    expect(result.valueMinCents).toBeLessThanOrEqual(result.estimatedValueCents);
    expect(result.valueMaxCents).toBeGreaterThanOrEqual(result.estimatedValueCents);
    expect(result.confidenceScore).toBeGreaterThanOrEqual(0);
    expect(result.confidenceScore).toBeLessThanOrEqual(100);
    expect(["low", "medium", "high"]).toContain(result.confidenceLabel);
    expect(result.explanation.mainFactors.length).toBeGreaterThan(0);
    expect(["overvalued", "fair", "undervalued"]).toContain(result.positionLabel);
  });
});
