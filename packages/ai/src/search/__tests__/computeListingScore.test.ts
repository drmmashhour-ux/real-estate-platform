import { describe, expect, it } from "vitest";
import { computeListingScore } from "../computeListingScore";

describe("computeListingScore", () => {
  const baseListing = {
    city: "Montreal",
    nightPriceCents: 120_00,
    maxGuests: 4,
    propertyType: "Apartment",
    createdAt: new Date(),
    amenities: ["WiFi", "Kitchen"],
  };

  it("scores higher when city and filters align", () => {
    const a = computeListingScore({
      listing: baseListing,
      filters: { city: "Montreal", guests: 2, minPrice: 50, maxPrice: 200 },
      metrics: null,
      cityAvgNightPriceCents: 130_00,
      demandScore01: 0.5,
      userProfile: null,
      fairnessJitter: 0.5,
    });
    const b = computeListingScore({
      listing: { ...baseListing, city: "Toronto" },
      filters: { city: "Montreal" },
      metrics: null,
      cityAvgNightPriceCents: 130_00,
      demandScore01: 0.5,
      userProfile: null,
      fairnessJitter: 0.5,
    });
    expect(a.score).toBeGreaterThan(b.score);
    expect(a.breakdown.relevance).toBeGreaterThan(b.breakdown.relevance);
  });

  it("respects price competitiveness vs city average", () => {
    const cheap = computeListingScore({
      listing: { ...baseListing, nightPriceCents: 90_00 },
      filters: {},
      metrics: null,
      cityAvgNightPriceCents: 150_00,
      demandScore01: 0.5,
      userProfile: null,
      fairnessJitter: 0.1,
    });
    const pricey = computeListingScore({
      listing: { ...baseListing, nightPriceCents: 220_00 },
      filters: {},
      metrics: null,
      cityAvgNightPriceCents: 150_00,
      demandScore01: 0.5,
      userProfile: null,
      fairnessJitter: 0.1,
    });
    expect(cheap.breakdown.price).toBeGreaterThanOrEqual(pricey.breakdown.price);
  });

  it("non-AI sort path is unaffected — scoring is pure function", () => {
    const r = computeListingScore({
      listing: baseListing,
      filters: { city: "Montreal" },
      metrics: {
        id: "m1",
        listingId: "x",
        views7d: 10,
        views30d: 10,
        bookings7d: 1,
        bookings30d: 1,
        ctr: 0.1,
        conversionRate: 0.05,
        avgStayLength: null,
        updatedAt: new Date(),
      },
      cityAvgNightPriceCents: 120_00,
      demandScore01: 0.8,
      userProfile: null,
      fairnessJitter: 0,
    });
    expect(r.score).toBeGreaterThan(0);
    expect(r.breakdown.demand).toBeGreaterThan(0);
  });
});
