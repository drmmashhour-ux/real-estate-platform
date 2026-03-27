import { describe, expect, it } from "vitest";
import {
  computePropertyScore,
  convertScoreToStars,
  type ListingForClassification,
} from "./propertyClassificationService";

describe("convertScoreToStars", () => {
  it("maps bands to 1–5 stars", () => {
    expect(convertScoreToStars(0)).toBe(1);
    expect(convertScoreToStars(30)).toBe(1);
    expect(convertScoreToStars(31)).toBe(2);
    expect(convertScoreToStars(50)).toBe(2);
    expect(convertScoreToStars(51)).toBe(3);
    expect(convertScoreToStars(70)).toBe(3);
    expect(convertScoreToStars(71)).toBe(4);
    expect(convertScoreToStars(85)).toBe(4);
    expect(convertScoreToStars(86)).toBe(5);
    expect(convertScoreToStars(100)).toBe(5);
  });
});

function photos(n: number): string[] {
  return Array.from({ length: n }, (_, i) => `https://example.test/p/${i}.jpg`);
}

describe("computePropertyScore", () => {
  it("rates a sparse listing as 1–2 stars", () => {
    const listing: ListingForClassification = {
      title: "Room",
      description: "Ok.",
      maxGuests: 6,
      beds: 1,
      bedrooms: 1,
      amenities: [],
      safetyFeatures: [],
      checkInInstructions: null,
      instantBookEnabled: false,
      cleaningFeeCents: 0,
      minStayNights: 1,
      maxStayNights: 7,
      neighborhoodDetails: null,
      experienceTags: [],
      servicesOffered: [],
      photos: photos(1),
    };
    const r = computePropertyScore(listing);
    expect(r.starRating).toBeLessThanOrEqual(2);
    expect(r.overallScore).toBeLessThanOrEqual(50);
  });

  it("rates an average listing around 3 stars", () => {
    const listing: ListingForClassification = {
      title: "Two-bedroom apartment",
      description:
        "Near transit. WiFi, kitchen, washer. Keypad self check-in. ".padEnd(220, "x"),
      maxGuests: 4,
      beds: 2,
      bedrooms: 2,
      amenities: ["WiFi", "Kitchen", "Washer", "Heating"],
      safetyFeatures: ["Smoke detector", "Deadbolt lock"],
      checkInInstructions: "Keypad self check-in.",
      instantBookEnabled: false,
      cleaningFeeCents: 3500,
      minStayNights: 2,
      maxStayNights: 30,
      neighborhoodDetails:
        "Quiet residential block, walkable to transit, safe evenings, grocery nearby for guests.",
      experienceTags: [],
      servicesOffered: [],
      photos: photos(3),
    };
    const r = computePropertyScore(listing);
    expect(r.starRating).toBe(3);
    expect(r.overallScore).toBeGreaterThanOrEqual(51);
    expect(r.overallScore).toBeLessThanOrEqual(70);
  });

  it("rates a strong listing at 4 stars", () => {
    const listing: ListingForClassification = {
      title: "Bright loft near restaurants",
      description:
        "Open layout, fibre WiFi, full kitchen, washer and dryer, ductless AC and heat. Professionally cleaned between stays. Mid-stay cleaning available. Responsive host. ".padEnd(
          230,
          "y"
        ),
      maxGuests: 4,
      beds: 2,
      bedrooms: 2,
      amenities: ["WiFi", "Kitchen", "Washer", "Dryer", "Air conditioning", "Heating"],
      safetyFeatures: ["Smoke detector", "Carbon monoxide detector", "Smart lock"],
      checkInInstructions: "Keypad self check-in; code rotates.",
      instantBookEnabled: true,
      cleaningFeeCents: 8000,
      minStayNights: 2,
      maxStayNights: null,
      neighborhoodDetails:
        "Lively area, well-lit streets, walkable dining, residential mix above shops, quiet overnight.",
      experienceTags: [],
      servicesOffered: ["cleaning"],
      photos: photos(6),
    };
    const r = computePropertyScore(listing);
    expect(r.starRating).toBe(4);
    expect(r.overallScore).toBeGreaterThanOrEqual(71);
    expect(r.overallScore).toBeLessThanOrEqual(85);
  });

  it("rates a luxury wording + full-signal listing at 5 stars", () => {
    const listing: ListingForClassification = {
      title: "Waterfront penthouse villa — panoramic views",
      description:
        "Private pool marble finishes estate-quality designer renovation. One-of-a-kind historic loft conversion with panoramic oceanfront outlook. Professionally cleaned, premium linens, chef's kitchen, soaking tub, private terrace pool. Self check-in smart lock. Ski-in access to lifts in winter. Quiet safe enclave.".repeat(
          1
        ),
      maxGuests: 4,
      beds: 2,
      bedrooms: 2,
      amenities: [
        "WiFi",
        "Kitchen",
        "Washer",
        "Air conditioning",
        "Heating",
        "Private pool",
        "Ocean view",
        "Balcony",
      ],
      safetyFeatures: ["Smoke detector", "Smart lock"],
      checkInInstructions: "Keypad self check-in.",
      instantBookEnabled: true,
      cleaningFeeCents: 12000,
      maxStayNights: null,
      neighborhoodDetails:
        "Waterfront quiet residential area, very safe, walkable promenade, family-friendly evenings.",
      experienceTags: ["exterior", "patio"],
      servicesOffered: ["housekeeping"],
      photos: photos(6),
    };
    const r = computePropertyScore(listing);
    expect(r.starRating).toBe(5);
    expect(r.overallScore).toBeGreaterThanOrEqual(86);
  });
});
