import { describe, expect, it } from "vitest";
import { runListingOptimizer } from "../listing-optimizer";

describe("runListingOptimizer", () => {
  it("flags short titles and few photos", () => {
    const r = runListingOptimizer({
      id: "1",
      title: "Loft",
      description: "Ok.",
      city: "Montreal",
      propertyType: "Apartment",
      beds: 2,
      amenities: ["wifi"],
      structuredPhotoCount: 2,
      legacyPhotoUrlCount: 0,
    });
    expect(r.suggestedTitle).toBeTruthy();
    expect(r.photoImprovements.length).toBeGreaterThan(0);
    expect(r.missingAmenities.length).toBeGreaterThan(0);
  });
});
