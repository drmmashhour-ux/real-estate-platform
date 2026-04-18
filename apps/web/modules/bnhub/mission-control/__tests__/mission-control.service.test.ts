import { describe, expect, it, vi, beforeEach } from "vitest";
import { buildBNHubMissionControl } from "../mission-control.service";
import { resetMissionControlMonitoringForTests } from "../mission-control-monitoring.service";

vi.mock("../mission-control-snapshot.service", () => ({
  buildBNHubMissionControlSnapshot: vi.fn(),
}));

vi.mock("../mission-control-recommendations.service", () => ({
  buildMissionControlRecommendations: vi.fn().mockReturnValue([
    {
      id: "r1",
      title: "Test",
      description: "d",
      impact: "low" as const,
      why: "w",
    },
  ]),
  resetMissionControlRecommendationIdsForTests: vi.fn(),
}));

import { buildBNHubMissionControlSnapshot } from "../mission-control-snapshot.service";

describe("buildBNHubMissionControl", () => {
  beforeEach(() => {
    resetMissionControlMonitoringForTests();
  });

  it("returns summary when snapshot exists", async () => {
    vi.mocked(buildBNHubMissionControlSnapshot).mockResolvedValue({
      listingId: "l1",
      listingTitle: "Hi",
      createdAt: new Date().toISOString(),
      rankingFinalScore: 55,
      rankingBreakdown: {
        conversionScore: 14,
        qualityScore: 12,
        trustScore: 12,
        freshnessScore: 8,
        priceCompetitivenessScore: 12,
      },
      hostListingStatus: "healthy",
      hostWeakSignals: [],
      hostStrongSignals: ["Solid booking and engagement signals"],
      guestConversionStatus: "healthy",
      guestConversionWeakSignals: [],
      bookingHealth: "healthy",
      trustScoreBreakdown: 12,
      reviewCount: 2,
      pricingSignalLabel: "neutral",
      dataNotes: [],
    });

    const s = await buildBNHubMissionControl("l1");
    expect(s.listingId).toBe("l1");
    expect(s.rankingScore).toBe(55);
    expect(s.status).toBeDefined();
  });

  it("returns weak when listing missing", async () => {
    vi.mocked(buildBNHubMissionControlSnapshot).mockResolvedValue(null);
    const s = await buildBNHubMissionControl("x");
    expect(s.status).toBe("weak");
  });
});
