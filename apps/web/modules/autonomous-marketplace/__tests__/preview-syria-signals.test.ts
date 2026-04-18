import { describe, expect, it, vi } from "vitest";
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
      id: "obs-syria-test",
      target: { type: "syria_listing", id: "sy1", label: "Syria row" },
      signals: [],
      aggregates: {},
      facts: {
        listingId: "sy1",
        syriaListingStatus: "PUBLISHED",
        fraudFlag: true,
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
      views: 0,
      bookings: 0,
      conversionRate: 0,
      price: 250000,
      listingStatus: "PUBLISHED",
    },
    facts: {},
    availabilityNotes: [],
  })),
}));

describe("Syria preview signal pipeline", () => {
  it("attaches Syria signals, policy, and keeps DRY_RUN", async () => {
    const { autonomousMarketplaceEngine } = await import("../execution/autonomous-marketplace.engine");
    const out = await autonomousMarketplaceEngine.previewForListing({
      listingId: "sy1",
      source: "syria",
      regionCode: "sy",
      dryRun: true,
    });

    expect(out.executionResult.status).toBe("DRY_RUN");
    expect(out.syriaSignals?.length).toBeGreaterThan(0);
    expect(out.syriaPolicyPreview?.decision).toBe("requires_local_approval");
    expect(out.syriaOpportunities?.length).toBeGreaterThan(0);
    expect(out.syriaSignalExplainability?.length).toBeGreaterThan(0);
  });

  it("policy evaluation matches severity rules", () => {
    expect(
      evaluateSyriaPreviewPolicyFromSignals([
        {
          type: "inactive_listing",
          severity: "info",
          message: "",
          contributingMetrics: {},
        },
      ]).decision,
    ).toBe("allow_preview");

    expect(
      evaluateSyriaPreviewPolicyFromSignals([
        {
          type: "review_backlog",
          severity: "warning",
          message: "",
          contributingMetrics: {},
        },
      ]).decision,
    ).toBe("caution_preview");

    expect(
      evaluateSyriaPreviewPolicyFromSignals([
        {
          type: "potential_fraud_pattern",
          severity: "critical",
          message: "",
          contributingMetrics: {},
        },
      ]).decision,
    ).toBe("requires_local_approval");
  });
});
