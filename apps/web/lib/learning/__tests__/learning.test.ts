import { describe, expect, it } from "vitest";
import { BEHAVIOR_EVENT_WEIGHTS, LEARNING_RANK_BLEND, NEUTRAL_BEHAVIOR_SCORE } from "@/lib/learning/behavior-weights";
import { computeListingContextMatch, preferenceVectorFromProfile } from "@/lib/learning/contextPreference";
import type { ListingLearningFeatures } from "@/lib/learning/types";
import { getRankingExplanation } from "@/lib/learning/explanations";

describe("behavior weights", () => {
  it("has positive weights for high-intent events", () => {
    expect(BEHAVIOR_EVENT_WEIGHTS.LISTING_BOOKING_SUCCESS).toBeGreaterThan(BEHAVIOR_EVENT_WEIGHTS.LISTING_CLICK);
    expect(Object.values(LEARNING_RANK_BLEND).reduce((a, b) => a + b, 0)).toBeCloseTo(1, 5);
  });

  it("neutral behavior baseline", () => {
    expect(NEUTRAL_BEHAVIOR_SCORE).toBe(0.5);
  });
});

describe("context match", () => {
  const baseFeatures = (city: string): ListingLearningFeatures => ({
    listingId: "x",
    city,
    region: null,
    country: "CA",
    category: "stay",
    propertyType: "Apartment",
    roomType: "Entire place",
    priceBucket: "120-180",
    nightPriceCents: 15000,
    bedrooms: 2,
    beds: 2,
    baths: 1,
    maxGuests: 4,
    hasParking: true,
    hasPool: false,
    hasBalcony: false,
    hasKitchen: true,
    petFriendly: false,
    freshnessBucket: "recent",
    featuredPromotion: false,
    verificationStatus: "VERIFIED",
  });

  it("falls back to neutral when no prefs", () => {
    const m = computeListingContextMatch(baseFeatures("Montreal"), preferenceVectorFromProfile(null), "Montreal");
    expect(m).toBeGreaterThan(0.3);
  });
});

describe("explanations", () => {
  it("returns a label without throwing", () => {
    const f = getRankingExplanation({
      features: {
        listingId: "a",
        city: "Montreal",
        region: null,
        country: "CA",
        category: "stay",
        propertyType: null,
        roomType: null,
        priceBucket: "mid",
        nightPriceCents: 12000,
        bedrooms: 1,
        beds: 1,
        baths: 1,
        maxGuests: 2,
        hasParking: false,
        hasPool: false,
        hasBalcony: false,
        hasKitchen: true,
        petFriendly: false,
        freshnessBucket: "fresh",
        featuredPromotion: false,
        verificationStatus: "VERIFIED",
      },
      stats: null,
      contextMatch: 0.5,
      searchCity: "Montreal",
    });
    expect(f.label.length).toBeGreaterThan(3);
  });
});
