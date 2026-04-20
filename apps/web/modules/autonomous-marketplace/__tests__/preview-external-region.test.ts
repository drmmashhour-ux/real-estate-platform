import { describe, expect, it, vi } from "vitest";

vi.mock("@/config/feature-flags", () => ({
  engineFlags: {
    autonomousMarketplaceV1: true,
    syriaRegionAdapterV1: false,
    syriaPreviewV1: false,
    regionListingKeyV1: true,
  },
}));

describe("AutonomousMarketplaceEngine.previewForListing external branch", () => {
  it("returns DRY_RUN stub without guessing regions or executing", async () => {
    const { autonomousMarketplaceEngine } = await import("../execution/autonomous-marketplace.engine");
    const out = await autonomousMarketplaceEngine.previewForListing({
      listingId: "ext-1",
      source: "external",
      regionCode: "eu",
    });
    expect(out.executionResult.status).toBe("DRY_RUN");
    expect(out.previewNotes).toContain("external_listing_preview_not_configured_in_web_app");
    expect(out.observation.facts && (out.observation.facts as Record<string, unknown>).externalPreview).toBe(true);
  });
});
