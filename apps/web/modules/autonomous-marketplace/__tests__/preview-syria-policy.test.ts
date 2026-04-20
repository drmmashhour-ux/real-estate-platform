/**
 * Syria preview policy + approval boundary surfaced on listing preview response.
 */
import { describe, expect, it, vi } from "vitest";
import { evaluateSyriaApprovalBoundary } from "@/modules/integrations/regions/syria/syria-approval-boundary.service";
import { evaluateSyriaPreviewPolicyFromSignals } from "@/modules/integrations/regions/syria/syria-policy.service";

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
      id: "obs-policy",
      target: { type: "syria_listing", id: "s1", label: "Syria row" },
      signals: [],
      aggregates: {},
      facts: {
        listingId: "s1",
        syriaListingStatus: "PUBLISHED",
        fraudFlag: false,
        detectorsFsboOnlyNote: "preview_detectors_require_fsbo_listing_target_syria_returns_empty_opportunities",
        bookingStats: {
          bookingCount: 0,
          fraudBookings: 0,
          payoutPending: 0,
          payoutPaid: 0,
        },
      },
      builtAt: new Date().toISOString(),
    },
    metrics: {
      views: 10,
      bookings: 0,
      conversionRate: 0,
      price: 100000,
      listingStatus: "PUBLISHED",
    },
    facts: {},
    availabilityNotes: [],
  })),
}));

describe("preview Syria policy + boundary", () => {
  it("engine returns syriaPolicyPreview and syriaApprovalBoundary", async () => {
    const { autonomousMarketplaceEngine } = await import("../execution/autonomous-marketplace.engine");
    const out = await autonomousMarketplaceEngine.previewForListing({
      listingId: "s1",
      source: "syria",
      regionCode: "sy",
      dryRun: true,
    });

    expect(out.syriaPolicyPreview?.decision).toBeDefined();
    expect(out.syriaApprovalBoundary?.liveExecutionBlocked).toBe(true);
    expect(out.syriaApprovalBoundary?.reasons.length).toBeGreaterThan(0);
  });

  it("boundary is consistent with policy helper", () => {
    const policy = evaluateSyriaPreviewPolicyFromSignals([]);
    const boundary = evaluateSyriaApprovalBoundary({ policy });
    expect(boundary.liveExecutionBlocked).toBe(true);
  });
});
