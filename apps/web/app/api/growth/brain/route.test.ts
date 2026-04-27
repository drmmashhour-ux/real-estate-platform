import { describe, it, expect, vi, beforeEach } from "vitest";

import { GET } from "./route";

const fixtures = vi.hoisted(() => {
  const mockSummary = {
    earlyUsers: { count: 10, remaining: 90, isEarlyPhase: true },
    referrals: { totalReferrals: 2, topReferrers: [] as { ownerUserId: string; referralCount: number }[] },
    campaigns: {
      totalCampaigns: 1,
      campaignsToScale: 0,
      campaignsToImprove: 1,
      campaignsToPause: 0,
    },
    conversion: { highIntentUsers: 3, activeSearches: 12 },
  };
  const mockActions = [
    {
      id: "gb-x",
      priority: "low" as const,
      area: "conversion" as const,
      title: "T",
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

vi.mock("@/lib/growth/growthBrain", () => ({
  getGrowthBrainSummary: vi.fn().mockResolvedValue(fixtures.mockSummary),
  getGrowthBrainActions: vi.fn().mockResolvedValue(fixtures.mockActions),
}));

vi.mock("@/lib/security/rateLimit", () => ({
  getClientIp: () => "127.0.0.1",
  rateLimit: () => true,
}));

vi.mock("@/lib/monitoring/errorLogger", () => ({
  logError: vi.fn(),
}));

vi.mock("@/src/services/analytics", () => ({
  trackEvent: vi.fn().mockResolvedValue(undefined),
}));

import { getGrowthBrainActions, getGrowthBrainSummary } from "@/lib/growth/growthBrain";
import { trackEvent } from "@/src/services/analytics";

describe("GET /api/growth/brain (enabled)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns summary, actions, and records growth_brain_viewed", async () => {
    const res = await GET(new Request("http://localhost/api/growth/brain"));
    expect(res.status).toBe(200);
    const data = (await res.json()) as {
      summary: (typeof fixtures)["mockSummary"];
      actions: (typeof fixtures)["mockActions"];
    };
    expect(data.summary?.earlyUsers.count).toBe(10);
    expect(data.actions).toHaveLength(1);
    expect(vi.mocked(getGrowthBrainSummary)).toHaveBeenCalled();
    expect(vi.mocked(getGrowthBrainActions)).toHaveBeenCalled();
    expect(vi.mocked(trackEvent)).toHaveBeenCalledWith("growth_brain_viewed", { actionCount: 1 });
  });
});
