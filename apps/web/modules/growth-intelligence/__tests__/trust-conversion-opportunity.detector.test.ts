import { describe, expect, it } from "vitest";
import { detectTrustConversionOpportunity } from "../detectors/trust-conversion-opportunity.detector";
import { emptyGrowthSnapshot } from "./snapshot-fixtures";

describe("detectTrustConversionOpportunity", () => {
  it("fires when trust readiness is strong but listing views sit low", () => {
    const snap = emptyGrowthSnapshot({
      funnelRatiosByListing: [
        { listingId: "L-low", views: 2, contactClicks: 0, ratio: 0 },
        { listingId: "L-mid", views: 40, contactClicks: 1, ratio: 0.025 },
        { listingId: "L-high", views: 200, contactClicks: 5, ratio: 0.025 },
      ],
      rankingHints: [{ listingId: "L-low", rankingScore: 80 }],
      legalReadinessSamples: [{ listingId: "L-low", readinessHint: 82 }],
    });
    expect(() => detectTrustConversionOpportunity(snap)).not.toThrow();
    const signals = detectTrustConversionOpportunity(snap);
    expect(signals.some((s) => s.entityId === "L-low")).toBe(true);
    expect(signals[0]?.signalType).toBe("trust_conversion_opportunity");
  });

  it("does not fire when exposure matches trust band", () => {
    const snap = emptyGrowthSnapshot({
      funnelRatiosByListing: [
        { listingId: "L-peer-a", views: 10, contactClicks: 0, ratio: 0 },
        { listingId: "L-peer-b", views: 15, contactClicks: 0, ratio: 0 },
        { listingId: "L1", views: 120, contactClicks: 3, ratio: 0.025 },
        { listingId: "L-peer-c", views: 200, contactClicks: 4, ratio: 0.02 },
      ],
      rankingHints: [{ listingId: "L1", rankingScore: 90 }],
      legalReadinessSamples: [{ listingId: "L1", readinessHint: 85 }],
    });
    expect(detectTrustConversionOpportunity(snap)).toHaveLength(0);
  });

  it("does not throw without ranking hints", () => {
    expect(() => detectTrustConversionOpportunity(emptyGrowthSnapshot())).not.toThrow();
  });
});
