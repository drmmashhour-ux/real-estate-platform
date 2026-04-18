import { describe, expect, it, beforeEach } from "vitest";
import {
  buildMissionControlRecommendations,
  resetMissionControlRecommendationIdsForTests,
} from "../mission-control-recommendations.service";
import type { BNHubMissionControlRawSnapshot } from "../mission-control.types";
import type { MissionControlAnalysis } from "../mission-control-analyzer.service";

beforeEach(() => {
  resetMissionControlRecommendationIdsForTests();
});

describe("buildMissionControlRecommendations", () => {
  it("returns capped deterministic recommendations", () => {
    const snapshot: BNHubMissionControlRawSnapshot = {
      listingId: "x",
      listingTitle: null,
      createdAt: new Date().toISOString(),
      rankingFinalScore: 62,
      guestConversionStatus: "weak",
      hostListingStatus: "watch",
      hostWeakSignals: [],
      hostStrongSignals: [],
      guestConversionWeakSignals: [],
      bookingHealth: "watch",
      reviewCount: 0,
      pricingSignalLabel: "elevated_vs_cohort",
      rankingBreakdown: {
        conversionScore: 10,
        qualityScore: 8,
        trustScore: 8,
        freshnessScore: 8,
        priceCompetitivenessScore: 8,
      },
      guestMetrics: { listingViews: 25, bookingStarts: 0, bookingCompletions: 0 },
      dataNotes: [],
    };
    const analysis: MissionControlAnalysis = {
      weakSignals: [],
      strongSignals: [],
      topRisks: ["Trust gap"],
      topOpportunities: [],
    };
    const r = buildMissionControlRecommendations({ snapshot, analysis });
    expect(r.length).toBeLessThanOrEqual(8);
    expect(r[0].impact).toMatch(/low|medium|high/);
  });
});
