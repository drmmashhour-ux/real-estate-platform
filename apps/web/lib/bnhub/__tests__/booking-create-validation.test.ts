import { describe, expect, it } from "vitest";
import {
  countBnhubListingAmenities,
  countBnhubListingPhotos,
  validateBnhubBookingDateStrings,
  validateBnhubListingStructureForBooking,
} from "../booking-create-validation";

describe("validateBnhubBookingDateStrings", () => {
  it("accepts checkout-exclusive range", () => {
    const r = validateBnhubBookingDateStrings("2026-06-10", "2026-06-13");
    expect(r.ok).toBe(true);
  });

  it("rejects inverted dates", () => {
    const r = validateBnhubBookingDateStrings("2026-06-13", "2026-06-10");
    expect(r.ok).toBe(false);
  });
});

describe("validateBnhubListingStructureForBooking", () => {
  it("passes a well-formed listing", () => {
    const r = validateBnhubListingStructureForBooking({
      id: "x",
      title: "Nice stay",
      description: "A comfortable place with enough text here.",
      nightPriceCents: 10000,
      maxGuests: 4,
      photos: ["a", "b", "c"],
      amenities: ["wifi", "kitchen", "parking"],
    });
    expect(r.ok).toBe(true);
  });

  it("fails when photos < 3", () => {
    const r = validateBnhubListingStructureForBooking({
      id: "x",
      title: "Nice stay",
      description: "A comfortable place with enough text here.",
      nightPriceCents: 10000,
      maxGuests: 4,
      photos: ["a", "b"],
      amenities: ["wifi", "kitchen", "parking"],
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.some((e) => e.includes("3 photos"))).toBe(true);
  });
});

describe("countBnhubListingPhotos", () => {
  it("uses max of relation vs legacy json", () => {
    expect(
      countBnhubListingPhotos({
        id: "1",
        title: "t",
        description: "x".repeat(25),
        nightPriceCents: 100,
        maxGuests: 2,
        photos: [],
        amenities: ["a", "b", "c"],
        listingPhotos: [{ id: "a" }, { id: "b" }, { id: "c" }],
      }),
    ).toBe(3);
  });
});

describe("countBnhubListingAmenities", () => {
  it("counts json array", () => {
    expect(
      countBnhubListingAmenities({
        id: "1",
        title: "t",
        description: "x".repeat(25),
        nightPriceCents: 100,
        maxGuests: 2,
        photos: ["a", "b", "c"],
        amenities: ["x", "y", "z"],
      }),
    ).toBe(3);
  });
});
