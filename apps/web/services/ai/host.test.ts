import { describe, expect, it } from "vitest";
import { generateSimpleDescription, suggestAmenities } from "./host";

describe("host AI helpers", () => {
  it("generateSimpleDescription returns plain marketing text", () => {
    const t = generateSimpleDescription({
      title: "Sunny loft",
      city: "Montreal",
      propertyType: "Apartment",
      maxGuests: 4,
      bedrooms: 2,
      amenities: ["WiFi", "Kitchen"],
    });
    expect(t).toContain("Sunny loft");
    expect(t).toContain("Montreal");
    expect(t).not.toContain("{");
  });

  it("suggestAmenities returns labels for property type", () => {
    const a = suggestAmenities("House");
    expect(a.length).toBeGreaterThan(0);
    expect(a).toContain("WiFi");
  });
});
