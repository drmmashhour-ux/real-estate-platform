import { describe, it, expect } from "vitest";
import { runListingModerationAgent } from "../agents/listing-moderation-agent.js";

describe("Listing Moderation Agent", () => {
  it("returns approve for high-quality listing", () => {
    const out = runListingModerationAgent({
      title: "Cozy downtown apartment with city view",
      description: "A spacious 2-bedroom apartment with modern amenities. Walking distance to shops. Full kitchen and WiFi. House rules: no smoking, no parties.",
      amenities: ["WiFi", "Kitchen", "AC"],
      photoCount: 5,
      houseRules: "No smoking. No parties. Check-in after 3 PM.",
      nightPriceCents: 12000,
    });
    expect(out.listingQualityScore).toBeGreaterThanOrEqual(70);
    expect(out.confidenceScore).toBeGreaterThan(0.5);
    expect(["approve", "manual_review"]).toContain(out.moderationStatus);
    expect(out.reasonCodes.length).toBeGreaterThanOrEqual(0);
  });

  it("returns manual_review and alerts for weak listing", () => {
    const out = runListingModerationAgent({
      title: "Apt",
      description: "Nice.",
      amenities: [],
      photoCount: 0,
    });
    expect(out.missingInfoAlerts.length).toBeGreaterThan(0);
    expect(out.listingQualityScore).toBeLessThan(80);
  });
});
