import { describe, expect, it } from "vitest";
import { buildSyriaSignals } from "../syria-signal-builder.service";
import type { ObservationSnapshot } from "@/modules/autonomous-marketplace/types/domain.types";
import { SYRIA_STALE_LISTING_DAYS, SYRIA_VIEW_HIGH_THRESHOLD } from "../syria-signal-thresholds";

function obs(facts: Record<string, unknown>): ObservationSnapshot {
  return {
    id: "t",
    target: { type: "syria_listing", id: "L1", label: "x" },
    signals: [],
    aggregates: {},
    facts,
    builtAt: new Date().toISOString(),
  };
}

describe("buildSyriaSignals", () => {
  it("returns empty for null or missing facts", () => {
    expect(buildSyriaSignals(null)).toEqual([]);
    expect(
      buildSyriaSignals({
        id: "t",
        target: { type: "syria_listing", id: "1" },
        signals: [],
        aggregates: {},
        facts: null as unknown as Record<string, unknown>,
        builtAt: "",
      }),
    ).toEqual([]);
  });

  it("emits low_booking_activity and low_conversion when view metric is explicit", () => {
    const s = buildSyriaSignals(
      obs({
        listingId: "L1",
        syriaListingStatus: "PUBLISHED",
        listingViewCount: SYRIA_VIEW_HIGH_THRESHOLD + 1,
        bookingStats: { bookingCount: 0, fraudBookings: 0, payoutPending: 0, payoutPaid: 0 },
      }),
    );
    const types = s.map((x) => x.type);
    expect(types).toContain("low_booking_activity");
    expect(types).toContain("low_conversion_high_views");
  });

  it("does not emit view-based conversion when listingViewCount is absent", () => {
    const s = buildSyriaSignals(
      obs({
        syriaListingStatus: "PUBLISHED",
        bookingStats: { bookingCount: 0, fraudBookings: 0, payoutPending: 0, payoutPaid: 0 },
      }),
    );
    expect(s.map((x) => x.type)).not.toContain("low_conversion_high_views");
  });

  it("emits potential_fraud_pattern for fraud flag or fraud bookings", () => {
    const a = buildSyriaSignals(
      obs({ listingId: "L1", fraudFlag: true, syriaListingStatus: "PUBLISHED", bookingStats: null }),
    );
    expect(a.find((x) => x.type === "potential_fraud_pattern")?.severity).toBe("critical");

    const b = buildSyriaSignals(
      obs({
        syriaListingStatus: "PUBLISHED",
        bookingStats: { bookingCount: 2, fraudBookings: 1, payoutPending: 0, payoutPaid: 0 },
      }),
    );
    expect(b.map((x) => x.type)).toContain("potential_fraud_pattern");
  });

  it("emits listing_stale for published listings past threshold", () => {
    const s = buildSyriaSignals(
      obs({
        syriaListingStatus: "PUBLISHED",
        daysSinceListingUpdate: SYRIA_STALE_LISTING_DAYS + 1,
      }),
    );
    expect(s.map((x) => x.type)).toContain("listing_stale");
  });

  it("keeps strongest severity per signal type when duplicates would occur", () => {
    const s = buildSyriaSignals(
      obs({
        syriaListingStatus: "PUBLISHED",
        payoutStateHint: "pending_heavy",
        bookingStats: { bookingCount: 1, fraudBookings: 0, payoutPending: 5, payoutPaid: 0 },
      }),
    );
    const payout = s.filter((x) => x.type === "payout_anomaly");
    expect(payout.length).toBe(1);
  });

  it("never throws on malformed fragments", () => {
    expect(() =>
      buildSyriaSignals(
        obs({
          bookingStats: "bad" as unknown as Record<string, unknown>,
          syriaListingStatus: 123 as unknown as string,
        }),
      ),
    ).not.toThrow();
  });
});
