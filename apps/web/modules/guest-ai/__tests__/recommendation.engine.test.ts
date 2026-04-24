import { describe, expect, it } from "vitest";
import { getRecommendedListings, type GuestRecommendableListing } from "../recommendation.engine";
import type { GuestContext } from "../context.types";

const baseListing = (over: Partial<GuestRecommendableListing>): GuestRecommendableListing => ({
  id: "a",
  city: "Montreal",
  nightPriceCents: 15000,
  maxGuests: 4,
  beds: 2,
  baths: 1,
  propertyType: "Condo",
  amenities: ["WiFi", "Kitchen"],
  _count: { reviews: 5, bookings: 4 },
  reviews: [{ propertyRating: 4.6 }],
  availableForRequestedDates: true,
  ...over,
});

describe("getRecommendedListings", () => {
  it("ranks higher when city and budget align", () => {
    const ctx: GuestContext = {
      location: "Montreal",
      budgetRange: { min: 100, max: 200 },
      behaviorSignals: { viewedListingIds: [], likedListingIds: [], bookingHistory: [] },
    };
    const good = baseListing({ id: "1", nightPriceCents: 12000 });
    const bad = baseListing({
      id: "2",
      nightPriceCents: 12000,
      city: "Toronto",
      reviews: [{ propertyRating: 4.6 }],
    });
    const { ranked } = getRecommendedListings(ctx, [bad, good]);
    expect(ranked[0]?.listingId).toBe("1");
    expect(ranked[0]?.labels.some((l) => l.key === "good_match")).toBe(false);
  });

  it("surfaces popular_choice when bookings clear threshold", () => {
    const ctx: GuestContext = {
      location: "Montreal",
      behaviorSignals: { viewedListingIds: [], likedListingIds: [], bookingHistory: [] },
    };
    const popular = baseListing({ id: "p", _count: { reviews: 10, bookings: 12 } });
    const quiet = baseListing({ id: "q", _count: { reviews: 2, bookings: 0 } });
    const { ranked } = getRecommendedListings(ctx, [quiet, popular]);
    const p = ranked.find((r) => r.listingId === "p");
    expect(p?.labels.some((l) => l.key === "popular_choice")).toBe(true);
  });
});
