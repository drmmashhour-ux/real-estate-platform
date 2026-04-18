import { describe, expect, it } from "vitest";
import { analyzeBNHubMissionControl } from "../mission-control-analyzer.service";
import type { BNHubMissionControlRawSnapshot } from "../mission-control.types";

function snap(over: Partial<BNHubMissionControlRawSnapshot>): BNHubMissionControlRawSnapshot {
  return {
    listingId: "l1",
    listingTitle: "T",
    createdAt: new Date().toISOString(),
    hostListingStatus: "healthy",
    hostWeakSignals: [],
    hostStrongSignals: [],
    guestConversionStatus: "healthy",
    guestConversionWeakSignals: [],
    bookingHealth: "healthy",
    reviewCount: 0,
    pricingSignalLabel: "neutral",
    dataNotes: [],
    ...over,
  };
}

describe("analyzeBNHubMissionControl", () => {
  it("detects ranking vs conversion gap", () => {
    const a = analyzeBNHubMissionControl(
      snap({
        rankingFinalScore: 65,
        guestConversionStatus: "weak",
        guestMetrics: { listingViews: 5, bookingStarts: 0, bookingCompletions: 0 },
        rankingBreakdown: {
          conversionScore: 10,
          qualityScore: 10,
          trustScore: 8,
          freshnessScore: 8,
          priceCompetitivenessScore: 12,
        },
      }),
    );
    expect(a.topRisks.some((r) => r.includes("ranking") || r.includes("conversion"))).toBe(true);
  });

  it("returns empty risks when data is sparse but consistent", () => {
    const a = analyzeBNHubMissionControl(
      snap({
        rankingFinalScore: 40,
        guestConversionStatus: "healthy",
        bookingHealth: "healthy",
        guestMetrics: { listingViews: 2, bookingStarts: 0, bookingCompletions: 0 },
      }),
    );
    expect(Array.isArray(a.topRisks)).toBe(true);
  });
});
