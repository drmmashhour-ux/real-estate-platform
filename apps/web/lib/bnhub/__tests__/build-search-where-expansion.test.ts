import { describe, expect, it } from "vitest";
import { buildPublishedListingSearchWhere } from "../build-search-where";

describe("buildPublishedListingSearchWhere — expansion filters", () => {
  it("merges countryCode with published constraint", () => {
    const w = buildPublishedListingSearchWhere({ countryCode: "CA" });
    expect(w.listingStatus).toBe("PUBLISHED");
    expect(Array.isArray(w.AND)).toBe(true);
    const and = w.AND as object[];
    expect(and.some((x) => "OR" in x)).toBe(true);
  });

  it("applies marketCityId and marketCountryId when provided", () => {
    const w = buildPublishedListingSearchWhere({
      marketCityId: "city_1",
      marketCountryId: "country_1",
    });
    const and = w.AND as object[];
    expect(and.some((x) => (x as { marketCityId?: string }).marketCityId === "city_1")).toBe(true);
    expect(and.some((x) => (x as { marketCountryId?: string }).marketCountryId === "country_1")).toBe(true);
  });
});
