import { describe, expect, it, vi } from "vitest";

vi.mock("@/config/feature-flags", () => ({
  engineFlags: {
    autonomousMarketplaceV1: true,
    syriaRegionAdapterV1: true,
    syriaPreviewV1: true,
    regionListingKeyV1: true,
  },
}));

vi.mock("@/modules/integrations/regions/syria/syria-preview-adapter.service", () => ({
  buildSyriaListingObservationSnapshot: vi.fn(async () => ({
    observation: {
      id: "obs-syria-test",
      target: { type: "syria_listing", id: "sy1", label: "Syria row" },
      signals: [],
      aggregates: {},
      facts: {
        fraudFlag: false,
        detectorsFsboOnlyNote: "preview_detectors_require_fsbo_listing_target_syria_returns_empty_opportunities",
      },
      builtAt: new Date().toISOString(),
    },
    metrics: {
      views: 0,
      bookings: 1,
      conversionRate: 0,
      price: 250000,
      listingStatus: "PUBLISHED",
    },
    facts: {},
    availabilityNotes: [],
  })),
}));

describe("AutonomousMarketplaceEngine.previewForListing Syria branch", () => {
  it("returns DRY_RUN Syria preview without execution metadata path", async () => {
    const { autonomousMarketplaceEngine } = await import("../execution/autonomous-marketplace.engine");
    const out = await autonomousMarketplaceEngine.previewForListing({
      listingId: "sy1",
      source: "syria",
      regionCode: "sy",
      dryRun: true,
    });
    expect(out.executionResult.status).toBe("DRY_RUN");
    expect(out.executionUnavailableForSyria).toBe(true);
    expect(out.executionResult.metadata && (out.executionResult.metadata as Record<string, unknown>).syriaPreview).toBe(true);
    expect(out.observation.target.type).toBe("syria_listing");
    expect(out.regionListingRef?.displayId).toContain("sy:syria:");
  });
});
