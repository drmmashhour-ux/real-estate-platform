import { describe, it, expect } from "vitest";
import {
  createPropertyBodySchema,
  updatePropertyBodySchema,
  listPropertiesQuerySchema,
} from "./schemas.js";

describe("listing validation schemas", () => {
  describe("createPropertyBodySchema", () => {
    it("accepts minimal valid payload", () => {
      const result = createPropertyBodySchema.safeParse({
        type: "BNHUB",
        title: "Cozy loft",
        address: "123 Main St",
        city: "Montreal",
        country: "CA",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.currency).toBe("CAD");
        expect(result.data.images).toEqual([]);
        expect(result.data.amenities).toEqual([]);
      }
    });

    it("accepts full payload with images and amenities", () => {
      const result = createPropertyBodySchema.safeParse({
        type: "MARKETPLACE_RENT",
        title: "Apartment",
        description: "Nice place",
        address: "456 Oak Ave",
        city: "Toronto",
        region: "ON",
        country: "CA",
        latitude: 43.65,
        longitude: -79.38,
        priceCents: 150000,
        bedrooms: 2,
        beds: 2,
        baths: 1.5,
        houseRules: "No smoking.",
        images: [{ url: "https://example.com/1.jpg", sortOrder: 0 }],
        amenities: ["wifi", "parking"],
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid type", () => {
      expect(
        createPropertyBodySchema.safeParse({
          type: "INVALID",
          title: "x",
          address: "x",
          city: "x",
        }).success
      ).toBe(false);
    });

    it("rejects empty title", () => {
      expect(
        createPropertyBodySchema.safeParse({
          type: "BNHUB",
          title: "",
          address: "x",
          city: "x",
        }).success
      ).toBe(false);
    });

    it("rejects invalid URL in images", () => {
      expect(
        createPropertyBodySchema.safeParse({
          type: "BNHUB",
          title: "x",
          address: "x",
          city: "x",
          images: [{ url: "not-a-url" }],
        }).success
      ).toBe(false);
    });
  });

  describe("updatePropertyBodySchema", () => {
    it("accepts partial update", () => {
      expect(updatePropertyBodySchema.safeParse({ title: "New title" }).success).toBe(true);
      expect(updatePropertyBodySchema.safeParse({ status: "LIVE" }).success).toBe(true);
    });
  });

  describe("listPropertiesQuerySchema", () => {
    it("accepts empty query with defaults", () => {
      const result = listPropertiesQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.pageSize).toBe(20);
      }
    });

    it("accepts filters", () => {
      expect(
        listPropertiesQuerySchema.safeParse({
          page: 2,
          pageSize: 10,
          city: "Montreal",
          country: "CA",
          status: "LIVE",
        }).success
      ).toBe(true);
    });
  });
});
