import { describe, expect, it, beforeEach } from "vitest";
import {
  buildGuestConversionRecommendations,
  resetGuestConversionRecommendationIdsForTests,
} from "../guest-conversion-recommendations.service";
import type { GuestConversionFrictionContext } from "../guest-conversion.types";

function ctx(): GuestConversionFrictionContext {
  return {
    listingId: "x",
    windowDays: 30,
    searchMetrics: { impressions: 50, clicks: 1, clickThroughRate: 2 },
    listingMetrics: { listingViews: 30, bookingStarts: 0, bookingCompletions: 0, viewToStartRate: 0 },
    reviewCount: 0,
    photoCount: 1,
    hasDescription: true,
    nightPriceCents: 10000,
  };
}

describe("buildGuestConversionRecommendations", () => {
  beforeEach(() => {
    resetGuestConversionRecommendationIdsForTests();
  });

  it("returns deterministic recommendations from friction", () => {
    const friction = [
      {
        title: "Listing page → booking start gap",
        severity: "medium" as const,
        why: "test",
      },
    ];
    const r = buildGuestConversionRecommendations({ context: ctx(), frictionSignals: friction });
    expect(r.length).toBeGreaterThan(0);
    expect(r[0]).toMatchObject({ category: "listing_page", impact: "medium" });
  });

  it("may still surface discovery CTR hints without friction rows", () => {
    const r = buildGuestConversionRecommendations({ context: ctx(), frictionSignals: [] });
    expect(Array.isArray(r)).toBe(true);
    expect(r.some((x) => x.category === "search")).toBe(true);
  });
});
