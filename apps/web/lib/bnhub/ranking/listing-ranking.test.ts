import { describe, expect, it } from "vitest";
import {
  computeAvailabilityScore,
  computeFreshnessScore,
  computePerformanceScore,
  computeQualityScore,
  effectiveMarketplaceWeights,
  explainListingScore,
  scoreListingForSearch,
  sortListingsByMarketplaceScore,
  type ListingForMarketplaceRank,
} from "./listing-ranking";

const published = (partial: Partial<ListingForMarketplaceRank> = {}): ListingForMarketplaceRank => ({
  listingStatus: "PUBLISHED",
  title: "Cozy downtown apartment with skyline views",
  description: "x".repeat(450),
  photos: ["a", "b", "c", "d", "e"],
  amenities: ["wifi", "kitchen", "parking", "ac"],
  createdAt: new Date(Date.now() - 20 * 86400000),
  updatedAt: new Date(Date.now() - 5 * 86400000),
  _count: { reviews: 12, bookings: 20 },
  reviews: [{ propertyRating: 4.7 }],
  bnhubListingRatingAverage: 4.7,
  bnhubListingReviewCount: 12,
  bnhubListingCompletedStays: 8,
  ...partial,
});

describe("scoreListingForSearch", () => {
  it("richer listings score higher than thin listings", () => {
    const rich = published();
    const poor = published({
      title: "Hi",
      description: "short",
      photos: [],
      amenities: [],
      _count: { reviews: 0, bookings: 0 },
      reviews: [],
      bnhubListingRatingAverage: null,
      bnhubListingReviewCount: 0,
      bnhubListingCompletedStays: 0,
    });
    expect(scoreListingForSearch(rich, {}).score).toBeGreaterThan(scoreListingForSearch(poor, {}).score);
  });

  it("with dates, unavailable listing scores below available (availability component)", () => {
    const ctx = { checkIn: "2026-06-01", checkOut: "2026-06-05" };
    const avail = published({ availableForRequestedDates: true });
    const blocked = published({ availableForRequestedDates: false });
    expect(scoreListingForSearch(avail, ctx).score).toBeGreaterThan(scoreListingForSearch(blocked, ctx).score);
    expect(scoreListingForSearch(blocked, ctx).components.availability).toBe(0);
  });

  it("stale, incomplete listings score lower than fresh complete ones", () => {
    const fresh = published({
      updatedAt: new Date(),
      title: "Beautiful spacious loft near metro and parks",
    });
    const stale = published({
      updatedAt: new Date(Date.now() - 800 * 86400000),
      createdAt: new Date(Date.now() - 900 * 86400000),
      title: "x",
      description: "y",
      photos: ["a"],
      amenities: ["wifi"],
      _count: { reviews: 0, bookings: 0 },
      reviews: [],
      bnhubListingRatingAverage: null,
      bnhubListingReviewCount: 0,
      bnhubListingCompletedStays: null,
    });
    expect(scoreListingForSearch(fresh, {}).score).toBeGreaterThan(scoreListingForSearch(stale, {}).score);
    expect(computeFreshnessScore(fresh)).toBeGreaterThan(computeFreshnessScore(stale));
  });

  it("excludes non-published listings (score 0, excluded)", () => {
    const r = scoreListingForSearch(
      published({ listingStatus: "DRAFT" }),
      {},
    );
    expect(r.score).toBe(0);
    expect(r.excluded).toBe(true);
  });

  it("degrades gracefully when optional performance signals are missing", () => {
    const minimal = published({
      bnhubListingRatingAverage: null,
      bnhubListingReviewCount: null,
      bnhubListingCompletedStays: null,
      reviews: [],
      _count: { reviews: 0, bookings: 0 },
    });
    const s = scoreListingForSearch(minimal, {});
    expect(s.score).toBeGreaterThan(0);
    expect(s.score).toBeLessThanOrEqual(1);
    expect(s.components.performance).toBeGreaterThan(0);
    expect(s.components.performance).toBeLessThan(1);
  });

  it("applies a bounded host reputation nudge without hiding listings", () => {
    const base = published();
    const high = scoreListingForSearch({ ...base, hostReputationScore: 92 }, {}).score;
    const low = scoreListingForSearch({ ...base, hostReputationScore: 25 }, {}).score;
    const none = scoreListingForSearch({ ...base }, {}).score;
    expect(high).toBeGreaterThan(none);
    expect(low).toBeLessThan(none);
    expect(high).toBeLessThanOrEqual(1);
    expect(low).toBeGreaterThan(0);
  });
});

describe("effectiveMarketplaceWeights", () => {
  it("drops availability weight when no dates and renormalizes", () => {
    const w0 = effectiveMarketplaceWeights({});
    expect(w0.availability).toBe(0);
    expect(w0.quality + w0.performance + w0.freshness).toBeCloseTo(1, 5);
    const w1 = effectiveMarketplaceWeights({ checkIn: "2026-01-01", checkOut: "2026-01-03" });
    expect(w1.availability).toBeGreaterThan(0);
    expect(w1.quality + w1.performance + w1.availability + w1.freshness).toBeCloseTo(1, 5);
  });
});

describe("sortListingsByMarketplaceScore", () => {
  it("orders richer listing before poorer", () => {
    const a = published({ title: "A", description: "x".repeat(500) });
    const b = published({
      title: "B",
      description: "tiny",
      photos: ["a"],
      amenities: [],
      _count: { reviews: 0, bookings: 0 },
      reviews: [],
    });
    const sorted = sortListingsByMarketplaceScore([b, a], {});
    expect(sorted[0].title).toBe("A");
  });
});

describe("explainListingScore", () => {
  it("returns reasons including availability when dates set", () => {
    const ex = explainListingScore(published(), {
      checkIn: "2026-03-01",
      checkOut: "2026-03-04",
    });
    expect(ex.some((s) => s.includes("selected dates"))).toBe(true);
  });
});

describe("sub-scores", () => {
  it("computeQualityScore responds to content depth", () => {
    expect(computeQualityScore(published())).toBeGreaterThan(computeQualityScore(published({ photos: [] })));
  });

  it("computePerformanceScore uses reviews when present", () => {
    const withR = published({ _count: { reviews: 10, bookings: 10 }, reviews: [{ propertyRating: 5 }] });
    const noR = published({ _count: { reviews: 0, bookings: 0 }, reviews: [] });
    expect(computePerformanceScore(withR)).toBeGreaterThan(computePerformanceScore(noR));
  });

  it("computeAvailabilityScore is neutral without dates", () => {
    expect(computeAvailabilityScore(published({ availableForRequestedDates: false }), {})).toBe(0.5);
  });
});
