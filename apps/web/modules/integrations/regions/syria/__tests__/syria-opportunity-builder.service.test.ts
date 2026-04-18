import { describe, expect, it } from "vitest";
import { buildSyriaOpportunities } from "../syria-opportunity-builder.service";
import type { SyriaSignal } from "../syria-signal.types";

describe("buildSyriaOpportunities", () => {
  it("returns empty for empty signals", () => {
    expect(buildSyriaOpportunities([])).toEqual([]);
  });

  it("caps at five opportunities", () => {
    const signals: SyriaSignal[] = [
      {
        type: "inactive_listing",
        severity: "info",
        message: "m",
        contributingMetrics: { listingId: "A" },
      },
      {
        type: "listing_stale",
        severity: "info",
        message: "m",
        contributingMetrics: { listingId: "A" },
      },
      {
        type: "low_booking_activity",
        severity: "warning",
        message: "m",
        contributingMetrics: { listingId: "A" },
      },
      {
        type: "review_backlog",
        severity: "warning",
        message: "m",
        contributingMetrics: { listingId: "A" },
      },
      {
        type: "payout_anomaly",
        severity: "warning",
        message: "m",
        contributingMetrics: { listingId: "A" },
      },
      {
        type: "potential_fraud_pattern",
        severity: "critical",
        message: "m",
        contributingMetrics: { listingId: "A" },
      },
      {
        type: "low_conversion_high_views",
        severity: "warning",
        message: "m",
        contributingMetrics: { listingId: "A" },
      },
    ];
    const out = buildSyriaOpportunities(signals);
    expect(out.length).toBe(5);
    expect(out[0]?.signalType).toBe("potential_fraud_pattern");
    expect(out[0]?.priority).toBe("high");
  });

  it("uses deterministic ids", () => {
    const signals: SyriaSignal[] = [
      {
        type: "review_backlog",
        severity: "warning",
        message: "m",
        contributingMetrics: { listingId: "abc-123" },
      },
    ];
    const out = buildSyriaOpportunities(signals);
    expect(out[0]?.id).toBe("syria-opp-abc-123-review_backlog");
  });
});
