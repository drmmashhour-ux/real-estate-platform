import { describe, expect, it } from "vitest";
import {
  buildRevenueRecommendationsFromMetrics,
  revenueRecommendationUsesApprovalRequest,
  type ListingRevenueMetrics,
} from "./revenue-optimizer";

function baseMetrics(over: Partial<ListingRevenueMetrics> = {}): ListingRevenueMetrics {
  return {
    listingId: "lst-1",
    title: "Test stay",
    published: true,
    bookingCountLast30d: 0,
    bookingCountLast90d: 0,
    nightsBookedLast30d: 0,
    occupancyEstimate: 0,
    averageBookingValueCents: null,
    staleDaysSinceLastBooking: null,
    daysSinceListingCreated: 120,
    activePromotionExists: false,
    leadCountLast30d: 0,
    overallClassificationScore: 80,
    photoCount: 8,
    descriptionLength: 400,
    nightPriceCents: 10000,
    ...over,
  };
}

describe("buildRevenueRecommendationsFromMetrics", () => {
  it("low activity triggers promotion suggestion when listing is healthy", () => {
    const recs = buildRevenueRecommendationsFromMetrics(
      baseMetrics({
        bookingCountLast30d: 0,
        bookingCountLast90d: 0,
        overallClassificationScore: 70,
      }),
    );
    expect(recs.some((r) => r.type === "promotion_suggestion")).toBe(true);
  });

  it("active promotion suppresses new promotion suggestion", () => {
    const recs = buildRevenueRecommendationsFromMetrics(
      baseMetrics({
        bookingCountLast30d: 0,
        activePromotionExists: true,
      }),
    );
    expect(recs.some((r) => r.type === "promotion_suggestion")).toBe(false);
  });

  it("strong activity suppresses discount / promotion", () => {
    const recs = buildRevenueRecommendationsFromMetrics(
      baseMetrics({
        bookingCountLast30d: 5,
        bookingCountLast90d: 8,
      }),
    );
    expect(recs.some((r) => r.type === "promotion_suggestion")).toBe(false);
  });

  it("weak quality and low activity prioritizes listing quality (and not promotion)", () => {
    const recs = buildRevenueRecommendationsFromMetrics(
      baseMetrics({
        bookingCountLast30d: 0,
        overallClassificationScore: 40,
      }),
    );
    expect(recs.some((r) => r.type === "promotion_suggestion")).toBe(false);
    expect(recs.some((r) => r.type === "listing_quality_fix")).toBe(true);
  });

  it("weak quality and stale period includes copy refresh alongside quality fix", () => {
    const recs = buildRevenueRecommendationsFromMetrics(
      baseMetrics({
        bookingCountLast30d: 0,
        overallClassificationScore: 40,
        daysSinceListingCreated: 120,
        staleDaysSinceLastBooking: 90,
      }),
    );
    expect(recs.some((r) => r.type === "copy_refresh")).toBe(true);
    expect(recs.findIndex((r) => r.type === "listing_quality_fix")).toBeLessThan(
      recs.findIndex((r) => r.type === "copy_refresh"),
    );
  });

  it("unpublished listings produce no recommendations", () => {
    const recs = buildRevenueRecommendationsFromMetrics(
      baseMetrics({ published: false }),
    );
    expect(recs).toHaveLength(0);
  });
});

describe("revenueRecommendationUsesApprovalRequest", () => {
  it("pricing_review never uses approval queue", () => {
    expect(
      revenueRecommendationUsesApprovalRequest("pricing_review", {
        autopilotMode: "FULL_AUTOPILOT_APPROVAL",
        preferences: {
          autoPricing: true,
          autoMessaging: true,
          autoPromotions: true,
          autoListingOptimization: true,
        },
      }),
    ).toBe(false);
  });

  it("promotion uses approval only in full mode with autoPromotions", () => {
    expect(
      revenueRecommendationUsesApprovalRequest("promotion_suggestion", {
        autopilotMode: "ASSIST",
        preferences: {
          autoPricing: true,
          autoMessaging: true,
          autoPromotions: true,
          autoListingOptimization: true,
        },
      }),
    ).toBe(false);
    expect(
      revenueRecommendationUsesApprovalRequest("promotion_suggestion", {
        autopilotMode: "FULL_AUTOPILOT_APPROVAL",
        preferences: {
          autoPricing: true,
          autoMessaging: true,
          autoPromotions: true,
          autoListingOptimization: true,
        },
      }),
    ).toBe(true);
  });
});
