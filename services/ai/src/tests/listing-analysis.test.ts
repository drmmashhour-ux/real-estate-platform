import { describe, it, expect } from "vitest";
import { analyzeListing } from "../services/listing-analysis.service.js";

describe("listing-analysis", () => {
  it("returns high score for complete listing", () => {
    const out = analyzeListing({
      title: "Cozy downtown apartment with city view",
      description: "A spacious 2-bedroom apartment in the heart of the city with modern amenities and easy access to transport. Walking distance to shops and restaurants. Perfect for families and business travelers. Full kitchen, washer/dryer, and high-speed WiFi. Check-in after 3 PM; check-out by 11 AM. House rules: no smoking, no parties. Pets considered with fee.",
      amenities: ["WiFi", "Kitchen", "AC", "Parking"],
      location: { city: "NYC", address: "123 Main St" },
      photos: ["a", "b", "c", "d", "e"],
    });
    expect(out.overallScore).toBeGreaterThanOrEqual(80);
    expect(out.recommendations.length).toBe(0);
  });

  it("recommends title and description improvements when missing", () => {
    const out = analyzeListing({
      title: "Apt",
      description: "Nice",
      amenities: [],
      photos: [],
    });
    expect(out.recommendations.some((r) => r.type === "title")).toBe(true);
    expect(out.recommendations.some((r) => r.type === "description")).toBe(true);
    expect(out.overallScore).toBeLessThan(80);
  });

  it("suggests more photos when fewer than 5", () => {
    const out = analyzeListing({
      title: "Lovely house by the lake",
      description: "A beautiful house with a long description that meets the minimum length requirement for clarity.",
      amenities: ["WiFi", "Kitchen"],
      photos: ["1", "2"],
    });
    expect(out.recommendations.some((r) => r.type === "photos")).toBe(true);
  });
});
