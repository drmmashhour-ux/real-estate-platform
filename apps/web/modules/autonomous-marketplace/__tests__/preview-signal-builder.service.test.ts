import { describe, expect, it } from "vitest";
import { buildPreviewSignalsForListing, collectPreviewMetricCodes } from "../signals/preview-signal-builder.service";
import type { ListingObservationSnapshot } from "../types/listing-observation-snapshot.types";
import type { ObservationSnapshot } from "../types/domain.types";

function obsWithMetrics(listingId: string, m: ListingObservationSnapshot): ObservationSnapshot {
  return {
    id: "o1",
    target: { type: "fsbo_listing", id: listingId, label: "t" },
    signals: [],
    aggregates: {},
    facts: { metrics: m },
    builtAt: "2026-01-01T00:00:00.000Z",
  };
}

describe("buildPreviewSignalsForListing", () => {
  it("emits low_views and related signals for small view counts", async () => {
    const listingId = "lst_1";
    const o = obsWithMetrics(listingId, {
      views: 5,
      bookings: 0,
      conversionRate: 0.01,
      price: 1_000_00,
      listingStatus: "PUBLISHED",
    });
    const sigs = await buildPreviewSignalsForListing(listingId, o);
    const codes = collectPreviewMetricCodes(listingId, sigs);
    expect(codes.has("low_views")).toBe(true);
    expect(codes.has("low_booking_interest")).toBe(true);
    expect(sigs.length).toBeGreaterThan(0);
  });

  it("returns an empty array when no metrics are available and snapshot is null", async () => {
    const o: ObservationSnapshot = {
      id: "o1",
      target: { type: "fsbo_listing", id: "missing", label: undefined },
      signals: [],
      aggregates: {},
      facts: {},
      builtAt: "2026-01-01T00:00:00.000Z",
    };
    const sigs = await buildPreviewSignalsForListing("missing", o);
    expect(sigs).toEqual([]);
  });
});
