import { describe, it, expect } from "vitest";
import { analyzeListingQuality } from "../services/listing-quality.service.js";

describe("listing-quality", () => {
  it("returns high score for complete listing", () => {
    const out = analyzeListingQuality({
      title: "Cozy downtown apartment with city view",
      description: "A spacious 2-bedroom apartment in the heart of the city with modern amenities. Walking distance to shops and restaurants. Full kitchen, washer/dryer, and high-speed WiFi. Check-in after 3 PM; check-out by 11 AM. House rules: no smoking, no parties. Pets considered with fee. Contact us for any questions. Perfect for families and business travelers.",
      amenities: ["WiFi", "Kitchen", "AC", "Parking"],
      photoCount: 6,
      reviews: [{ rating: 4.8 }, { rating: 5 }],
    });
    expect(out.listingQualityScore).toBeGreaterThanOrEqual(80);
    expect(out.suggestedImprovements.length).toBe(0);
  });

  it("suggests improvements for weak listing", () => {
    const out = analyzeListingQuality({
      title: "Apt",
      description: "Nice.",
      amenities: [],
      photoCount: 1,
    });
    expect(out.suggestedImprovements.length).toBeGreaterThan(0);
    expect(out.listingQualityScore).toBeLessThan(80);
  });
});
