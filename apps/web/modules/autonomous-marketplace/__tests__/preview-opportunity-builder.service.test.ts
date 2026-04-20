import { describe, expect, it } from "vitest";
import { buildPreviewOpportunitiesFromSignals } from "../execution/preview-opportunity-builder.service";
import { buildPreviewSignalsForListing } from "../signals/preview-signal-builder.service";
import type { ListingObservationSnapshot } from "../types/listing-observation-snapshot.types";
import type { ObservationSnapshot } from "../types/domain.types";

function obs(listingId: string, m: ListingObservationSnapshot): ObservationSnapshot {
  return {
    id: "o1",
    target: { type: "fsbo_listing", id: listingId },
    signals: [],
    aggregates: {},
    facts: { metrics: m },
    builtAt: "2026-01-01T00:00:00.000Z",
  };
}

describe("buildPreviewOpportunitiesFromSignals", () => {
  it("maps low_views to review_listing_visibility", async () => {
    const listingId = "lst_low_views";
    const o = obs(listingId, {
      views: 10,
      bookings: 1,
      conversionRate: 0.05,
      price: 100,
      listingStatus: "PUBLISHED",
    });
    const signals = await buildPreviewSignalsForListing(listingId, o);
    const opps = buildPreviewOpportunitiesFromSignals(signals, o);
    expect(opps.length).toBeGreaterThan(0);
    expect(opps[0]?.evidence).toMatchObject({
      previewOpportunityCode: "review_listing_visibility",
    });
    expect(opps[0]?.proposedActions[0]?.metadata?.previewExecution).toBe("DRY_RUN");
  });

  it("returns no opportunities when signals are healthy-only", async () => {
    const listingId = "lst_ok";
    const o = obs(listingId, {
      views: 120,
      bookings: 5,
      conversionRate: 0.12,
      price: 250000,
      listingStatus: "PUBLISHED",
    });
    const signals = await buildPreviewSignalsForListing(listingId, o);
    const opps = buildPreviewOpportunitiesFromSignals(signals, o);
    expect(opps.length).toBe(0);
  });
});
