import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../growth-executive.service", () => ({
  buildGrowthExecutiveSummary: vi.fn(async () => ({
    status: "healthy",
    topPriorities: [],
    topRisks: [],
    campaignSummary: { totalCampaigns: 2, topCampaign: "utm-a", adsPerformance: "OK" },
    leadSummary: { totalLeads: 24, hotLeads: 3, dueNow: 2 },
    createdAt: new Date().toISOString(),
  })),
}));

vi.mock("../growth-daily-brief.service", () => ({
  buildGrowthDailyBrief: vi.fn(),
}));

vi.mock("../growth-ai-analyzer.service", () => ({
  fetchEarlyConversionAdsSnapshot: vi.fn(async () => ({ leadsToday: 4 })),
  computePaidFunnelAdsInsights: vi.fn(() => ({ health: "STRONG" })),
}));

vi.mock("../growth-governance.service", () => ({
  evaluateGrowthGovernance: vi.fn(),
}));

vi.mock("../growth-strategy.service", () => ({
  buildGrowthStrategyBundle: vi.fn(),
}));

vi.mock("@/config/feature-flags", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/config/feature-flags")>();
  return {
    ...mod,
    growthDailyBriefFlags: { ...mod.growthDailyBriefFlags, growthDailyBriefV1: false },
    growthGovernanceFlags: { ...mod.growthGovernanceFlags, growthGovernanceV1: false },
    growthStrategyFlags: { ...mod.growthStrategyFlags, growthStrategyV1: false },
  };
});

import { buildGrowthSimulationBaseline } from "../growth-simulation-baseline.service";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("buildGrowthSimulationBaseline", () => {
  it("merges executive snapshot with early conversion safely", async () => {
    const b = await buildGrowthSimulationBaseline();
    expect(b.leadsTotal).toBe(24);
    expect(b.topCampaign).toBe("utm-a");
    expect(b.leadsTodayEarly).toBe(4);
    expect(b.adsPerformance).toBe("OK");
    expect(b.hotLeads).toBe(3);
    expect(b.dueNow).toBe(2);
  });

  it("accumulates warnings when executive fails", async () => {
    const { buildGrowthExecutiveSummary } = await import("../growth-executive.service");
    vi.mocked(buildGrowthExecutiveSummary).mockRejectedValueOnce(new Error("down"));
    const b = await buildGrowthSimulationBaseline();
    expect(b.leadsTotal).toBe(0);
    expect(b.missingDataWarnings).toContain("executive_unavailable");
  });
});
