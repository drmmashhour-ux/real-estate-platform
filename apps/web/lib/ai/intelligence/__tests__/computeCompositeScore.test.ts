import { describe, expect, it } from "vitest";
import { computeCompositeScore } from "../computeCompositeScore";
import type { ListingSignals, UserSignals } from "@/lib/ai/core/types";

const baseListing = (): ListingSignals => ({
  listingId: "l1",
  city: "Montreal",
  region: "QC",
  propertyType: "Apartment",
  roomType: "Entire place",
  currentPrice: 120,
  nightPriceCents: 120_00,
  maxGuests: 4,
  avgAreaNightPrice: 130,
  demandScore: 0.55,
  demandScoreRaw: 0.55,
  conversionRate: 0.08,
  ctr: 0.12,
  occupancyRate: 0.35,
  bookingVelocity: 0.4,
  views7d: 20,
  views30d: 80,
  bookings7d: 1,
  bookings30d: 3,
  photoCount: 8,
  reviewAvg: 4.5,
  reviewCount: 12,
  hasActivePromotion: false,
  competitionCount: 40,
  createdAt: new Date(),
  qualityFlags: {
    lowPhotoCount: false,
    weakDescription: false,
    weakTitle: false,
    missingAmenities: false,
  },
});

describe("computeCompositeScore", () => {
  it("search domain boosts relevance with matching city filter", () => {
    const a = computeCompositeScore({
      domain: "search",
      listing: baseListing(),
      userSignals: null,
      searchContext: { filters: { city: "Montreal" } },
    });
    const b = computeCompositeScore({
      domain: "search",
      listing: { ...baseListing(), city: "Toronto" },
      userSignals: null,
      searchContext: { filters: { city: "Montreal" } },
    });
    expect(a.aiCompositeScore).toBeGreaterThan(b.aiCompositeScore);
  });

  it("pricing domain weights demand and price competitiveness", () => {
    const high = computeCompositeScore({
      domain: "pricing",
      listing: { ...baseListing(), demandScore: 0.85, currentPrice: 100, avgAreaNightPrice: 130 },
      userSignals: null,
    });
    const low = computeCompositeScore({
      domain: "pricing",
      listing: { ...baseListing(), demandScore: 0.25, currentPrice: 200, avgAreaNightPrice: 130 },
      userSignals: null,
    });
    expect(high.aiCompositeScore).toBeGreaterThan(low.aiCompositeScore);
  });

  it("personalization lifts recommendation domain when user matches", () => {
    const user: UserSignals = {
      userId: "u1",
      preferredCities: ["Montreal"],
      preferredTypes: [],
      preferredPriceMin: null,
      preferredPriceMax: null,
      preferredGuests: null,
      preferredAmenities: [],
      engagementScore: 0.7,
      bookingIntentScore: 0.6,
      luxuryPreferenceScore: 0.4,
    };
    const withUser = computeCompositeScore({
      domain: "recommendation",
      listing: baseListing(),
      userSignals: user,
      searchContext: { filters: { city: "Montreal" } },
    });
    const noUser = computeCompositeScore({
      domain: "recommendation",
      listing: baseListing(),
      userSignals: null,
      searchContext: { filters: { city: "Montreal" } },
    });
    expect(withUser.scores.personalizationScore).toBeGreaterThan(noUser.scores.personalizationScore);
  });
});
