import { describe, it, expect } from "vitest";
import { buildPublishedListingSearchWhere, searchOrderBy } from "./build-search-where";

describe("buildPublishedListingSearchWhere", () => {
  it("matches listing code case-insensitively", () => {
    const w = buildPublishedListingSearchWhere({ listingCode: "lec-12" });
    expect(w.listingCode).toEqual({ equals: "LEC-12", mode: "insensitive" });
  });

  it("parses LEC from city-style search text", () => {
    const w = buildPublishedListingSearchWhere({ city: "LEC-999" });
    expect(w.listingCode).toEqual({ equals: "LEC-999", mode: "insensitive" });
  });

  it("Canadian postal token expands to OR on address and city", () => {
    const w = buildPublishedListingSearchWhere({ city: "h2x 1y1" });
    expect(Array.isArray(w.OR)).toBe(true);
    expect(w.OR).toHaveLength(3);
  });

  it("known marketing slug expands to OR city variants (Laval)", () => {
    const w = buildPublishedListingSearchWhere({ city: "Laval" });
    expect(Array.isArray(w.OR)).toBe(true);
    expect(w.OR).toHaveLength(1);
    expect(w.OR![0]).toEqual({ city: { contains: "Laval", mode: "insensitive" } });
  });

  it("plain city uses contains on city", () => {
    const w = buildPublishedListingSearchWhere({ city: "Ottawa" });
    expect(w.city).toEqual({ contains: "Ottawa", mode: "insensitive" });
  });

  it("montreal slug expands to multiple city variants", () => {
    const w = buildPublishedListingSearchWhere({ city: "montreal" });
    expect(Array.isArray(w.OR)).toBe(true);
    expect(w.OR!.length).toBeGreaterThanOrEqual(2);
  });

  it("radius adds AND coordinate window", () => {
    const w = buildPublishedListingSearchWhere({
      city: "Montreal",
      centerLat: 45.5,
      centerLng: -73.6,
      radiusKm: 10,
    });
    const andClause = w.AND;
    const andArr = Array.isArray(andClause) ? andClause : andClause ? [andClause] : [];
    expect(andArr.length).toBeGreaterThanOrEqual(4);
  });

  it("ignores radius when out of range", () => {
    const w = buildPublishedListingSearchWhere({
      city: "Montreal",
      centerLat: 45.5,
      centerLng: -73.6,
      radiusKm: 500,
    });
    expect(w.AND).toBeUndefined();
  });

  it("verifiedOnly restricts to VERIFIED listings", () => {
    const w = buildPublishedListingSearchWhere({ city: "Montreal", verifiedOnly: true });
    expect(w.verificationStatus).toBe("VERIFIED");
  });
});

describe("searchOrderBy", () => {
  it("maps popular to review count", () => {
    const o = searchOrderBy("popular");
    expect(o[0]).toEqual({ reviews: { _count: "desc" } });
  });

  it("recommended empty order when not paginated", () => {
    expect(searchOrderBy("recommended", { paginated: false })).toEqual([]);
  });
});
