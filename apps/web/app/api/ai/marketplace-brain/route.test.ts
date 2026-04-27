import { describe, it, expect, vi, beforeEach } from "vitest";

import { GET } from "./route";

const fixtures = vi.hoisted(() => {
  const mockSummary = {
    demand: { hotCities: ["Montréal"], weakCities: ["Gatineau"] },
    pricing: { increaseCount: 2, decreaseCount: 1 },
    reputation: { trustedListingCount: 3, lowTrustListingCount: 4 },
    growth: { earlyUserCount: 10, remainingEarlySpots: 90 },
    campaigns: { campaignsToScale: 1, campaignsToImprove: 2, campaignsToPause: 0 },
  };
  const mockActions = [
    {
      id: "test-1",
      priority: "high" as const,
      area: "pricing" as const,
      title: "Test",
      description: "D",
      recommendedAction: "R",
      safeToAutomate: false,
    },
  ];
  return { mockSummary, mockActions };
});

vi.mock("@/lib/flags", () => ({
  flags: { AUTONOMOUS_AGENT: true, AI_PRICING: false, RECOMMENDATIONS: false },
}));

vi.mock("@/lib/ai/marketplaceBrain", () => ({
  getMarketplaceBrainSummary: vi.fn().mockResolvedValue(fixtures.mockSummary),
  getMarketplaceBrainActions: vi.fn().mockResolvedValue(fixtures.mockActions),
}));

vi.mock("@/lib/security/rateLimit", () => ({
  getClientIp: () => "127.0.0.1",
  rateLimit: () => true,
}));

vi.mock("@/lib/monitoring/errorLogger", () => ({
  logError: vi.fn(),
}));

import { getMarketplaceBrainActions, getMarketplaceBrainSummary } from "@/lib/ai/marketplaceBrain";

describe("GET /api/ai/marketplace-brain (enabled)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns summary and actions", async () => {
    const res = await GET(new Request("http://localhost/api/ai/marketplace-brain"));
    expect(res.status).toBe(200);
    const data = (await res.json()) as {
      summary: (typeof fixtures)["mockSummary"];
      actions: (typeof fixtures)["mockActions"];
    };
    expect(data.summary?.demand.hotCities).toContain("Montréal");
    expect(data.actions).toHaveLength(1);
    expect(vi.mocked(getMarketplaceBrainSummary)).toHaveBeenCalled();
    expect(vi.mocked(getMarketplaceBrainActions)).toHaveBeenCalled();
  });
});
