import { describe, expect, it } from "vitest";
import { ListingStatus } from "@prisma/client";
import {
  DYNAMIC_PRICING_LIVE_APPLY_DEFAULT,
  DYNAMIC_PRICING_RULE_THRESHOLDS,
  evaluateDynamicPricingFromSignals,
} from "../dynamic-pricing";
import type { BnhubPricingSignals } from "../pricing-signals";

function baseSignals(over: Partial<BnhubPricingSignals> = {}): BnhubPricingSignals {
  return {
    listingId: "lst_1",
    hostId: "host_1",
    title: "Test stay",
    listingStatus: ListingStatus.PUBLISHED,
    isPublished: true,
    currentNightlyPriceCents: 10_000,
    currency: "USD",
    recentBookingCount30d: 0,
    recentBookingCount90d: 1,
    daysSinceLastBooking: 40,
    occupancyEstimate: 0.1,
    activePromotionExists: false,
    upcomingAvailabilityGapDays: 20,
    recentViews7d: null,
    recentViews30d: null,
    inquiryCount30d: null,
    seasonalityProxyFromBookings: null,
    listingQualityScore: 70,
    photoCount: 6,
    descriptionLength: 400,
    ...over,
  };
}

describe("evaluateDynamicPricingFromSignals", () => {
  it("low demand suggests price decrease review", () => {
    const out = evaluateDynamicPricingFromSignals(
      baseSignals({
        recentBookingCount30d: DYNAMIC_PRICING_RULE_THRESHOLDS.lowBooking30d,
        recentBookingCount90d: DYNAMIC_PRICING_RULE_THRESHOLDS.lowBooking90dForSoftDemand,
        occupancyEstimate: 0.05,
        upcomingAvailabilityGapDays: DYNAMIC_PRICING_RULE_THRESHOLDS.longAvailableStreakDays,
        listingQualityScore: 70,
      }),
      { rejectedSimilarPricingAdviceCount: 0 },
    );
    expect(out?.recommendation.type).toBe("price_decrease_review");
    expect(out?.recommendation.ruleName).toBe("bnhub_dynamic_pricing_decrease_review");
  });

  it("strong demand + tight calendar suggests price increase review", () => {
    const out = evaluateDynamicPricingFromSignals(
      baseSignals({
        recentBookingCount30d: DYNAMIC_PRICING_RULE_THRESHOLDS.strongBooking30d,
        occupancyEstimate: 0.5,
        upcomingAvailabilityGapDays: DYNAMIC_PRICING_RULE_THRESHOLDS.tightCalendarStreakDays,
        recentBookingCount90d: 5,
      }),
      { rejectedSimilarPricingAdviceCount: 0 },
    );
    expect(out?.recommendation.type).toBe("price_increase_review");
    expect(out?.recommendation.ruleName).toBe("bnhub_dynamic_pricing_increase_review");
  });

  it("active promotion suppresses overlapping discount suggestion", () => {
    const out = evaluateDynamicPricingFromSignals(
      baseSignals({
        activePromotionExists: true,
        recentBookingCount30d: 0,
        recentBookingCount90d: 1,
        occupancyEstimate: 0.05,
        upcomingAvailabilityGapDays: 20,
        listingQualityScore: 70,
      }),
      { rejectedSimilarPricingAdviceCount: 0 },
    );
    expect(out).toBeNull();
  });

  it("weak listing quality prioritizes quality fixes before price cut", () => {
    const out = evaluateDynamicPricingFromSignals(
      baseSignals({
        listingQualityScore: 40,
        photoCount: 1,
        descriptionLength: 40,
        recentBookingCount30d: 0,
        recentBookingCount90d: 1,
        occupancyEstimate: 0.05,
        upcomingAvailabilityGapDays: 20,
      }),
      { rejectedSimilarPricingAdviceCount: 0 },
    );
    expect(out?.recommendation.type).toBe("improve_listing_before_price_change");
    expect(out?.recommendation.ruleName).toBe("bnhub_dynamic_pricing_improve_listing_first");
  });

  it("repeated rejected pricing advice gets lower priority or suppressed", () => {
    const normal = evaluateDynamicPricingFromSignals(
      baseSignals({
        recentBookingCount30d: 0,
        recentBookingCount90d: 1,
        occupancyEstimate: 0.05,
        upcomingAvailabilityGapDays: 20,
      }),
      { rejectedSimilarPricingAdviceCount: 0 },
    );
    expect(normal?.recommendation.priority).not.toBe("low");

    const dampened = evaluateDynamicPricingFromSignals(
      baseSignals({
        recentBookingCount30d: 0,
        recentBookingCount90d: 1,
        occupancyEstimate: 0.05,
        upcomingAvailabilityGapDays: 20,
      }),
      { rejectedSimilarPricingAdviceCount: 1 },
    );
    expect(dampened?.recommendation.priority).toBe("low");

    const suppressed = evaluateDynamicPricingFromSignals(
      baseSignals({
        recentBookingCount30d: 0,
        recentBookingCount90d: 1,
        occupancyEstimate: 0.05,
        upcomingAvailabilityGapDays: 20,
      }),
      { rejectedSimilarPricingAdviceCount: DYNAMIC_PRICING_RULE_THRESHOLDS.maxRejectedSimilarBeforeSuppress },
    );
    expect(suppressed).toBeNull();
  });

  it("pricing never auto-applies by default", () => {
    expect(DYNAMIC_PRICING_LIVE_APPLY_DEFAULT).toBe(false);
  });
});
