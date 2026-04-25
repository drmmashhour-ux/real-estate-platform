import { describe, expect, it } from "vitest";
import { suggestDynamicPrice } from "../pricing.engine";
import type { PricingAiSignalBundle } from "../signals.types";

const baseSignals = (): PricingAiSignalBundle => ({
  basePriceCents: 10_000,
  locationDemand01: 0.5,
  seasonalityFactor: 1,
  nearbyListingMedianCents: 10_000,
  nearbyListingSampleSize: 20,
  similarPropertyMedianCents: 10_000,
  similarPropertySampleSize: 8,
  occupancyRate01: 0.5,
  bookingLeadTimeDays: 14,
  eventDemand01: 0,
  listingViews30d: 10,
  bookingStarts30d: 1,
  viewToStartRate: 0.1,
  demandLevelLabel: "medium",
});

describe("suggestDynamicPrice", () => {
  it("returns reasoning and respects safety on extreme multipliers", () => {
    const listing = {
      id: "lst",
      nightPriceCents: 10_000,
      city: "Montreal",
      pricingMode: "MANUAL",
    };
    const signals = baseSignals();
    signals.locationDemand01 = 0.99;
    signals.occupancyRate01 = 0.95;
    signals.eventDemand01 = 1;
    const s = suggestDynamicPrice(listing, signals);
    expect(s.reasoning.length).toBeGreaterThan(2);
    expect(s.suggestedPriceCents).toBeLessThanOrEqual(13_000);
    expect(s.suggestedPriceCents).toBeGreaterThanOrEqual(7_000);
  });
});
