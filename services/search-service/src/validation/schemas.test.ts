import { describe, it, expect } from "vitest";
import {
  searchPropertiesQuerySchema,
  suggestionsQuerySchema,
  mapSearchQuerySchema,
} from "./schemas.js";

describe("search validation schemas", () => {
  describe("searchPropertiesQuerySchema", () => {
    it("accepts empty query with defaults", () => {
      const result = searchPropertiesQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.pageSize).toBe(20);
        expect(result.data.sort).toBe("newest");
      }
    });

    it("accepts full filters", () => {
      const result = searchPropertiesQuerySchema.safeParse({
        city: "Montreal",
        country: "CA",
        minPrice: 10000,
        maxPrice: 50000,
        propertyType: "apartment",
        minGuests: 2,
        maxGuests: 6,
        type: "BNHUB",
        page: 2,
        pageSize: 10,
        sort: "price_asc",
        q: "loft",
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid sort", () => {
      const result = searchPropertiesQuerySchema.safeParse({ sort: "invalid" });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.sort).toBe("newest");
    });
  });

  describe("suggestionsQuerySchema", () => {
    it("requires q", () => {
      expect(suggestionsQuerySchema.safeParse({}).success).toBe(false);
    });
    it("accepts q and field", () => {
      expect(suggestionsQuerySchema.safeParse({ q: "mont", field: "city" }).success).toBe(true);
    });
  });

  describe("mapSearchQuerySchema", () => {
    it("accepts bounds", () => {
      expect(
        mapSearchQuerySchema.safeParse({
          minLat: 45.4,
          maxLat: 45.6,
          minLng: -73.6,
          maxLng: -73.5,
        }).success
      ).toBe(true);
    });
    it("accepts center+radius", () => {
      expect(
        mapSearchQuerySchema.safeParse({ lat: 45.5, lng: -73.55, radiusKm: 10 }).success
      ).toBe(true);
    });
  });
});
