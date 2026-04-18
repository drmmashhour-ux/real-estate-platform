import { describe, expect, it, vi, beforeEach } from "vitest";
import { buildGrowthExecutiveSummary } from "../growth-executive.service";

vi.mock("../growth-executive-monitoring.service", () => ({
  logGrowthExecutiveBuildStarted: vi.fn(),
  recordGrowthExecutiveBuild: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    lead: {
      count: vi.fn().mockResolvedValue(10),
      findMany: vi.fn().mockResolvedValue([]),
    },
  },
}));

vi.mock("../ai-autopilot-api.helpers", () => ({
  listAutopilotActionsWithStatus: vi.fn().mockResolvedValue({
    actions: [],
    autopilotStatus: "healthy",
    grouped: { ads: [], cro: [], leads: [] },
    focusTitle: null,
    panelSignalStrength: "medium",
  }),
}));

vi.mock("../growth-ai-analyzer.service", () => ({
  fetchEarlyConversionAdsSnapshot: vi.fn().mockResolvedValue({
    campaignCounts: [{ label: "c1", count: 5 }],
    totalLeads: 12,
    leadsWithUtmCampaign: 8,
    leadsToday: 2,
    topCampaign: { label: "c1", count: 5 },
  }),
  computePaidFunnelAdsInsights: vi.fn().mockReturnValue({
    problems: [],
    opportunities: [],
    health: "OK",
  }),
}));

vi.mock("../growth-governance.service", () => ({
  evaluateGrowthGovernance: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/config/feature-flags", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/config/feature-flags")>();
  return {
    ...mod,
    growthGovernanceFlags: new Proxy(mod.growthGovernanceFlags, {
      get(t, p, r) {
        if (p === "growthGovernanceV1") return false;
        return Reflect.get(t, p, r);
      },
    }),
    growthFusionFlags: new Proxy(mod.growthFusionFlags, {
      get(t, p, r) {
        if (p === "growthFusionV1") return false;
        return Reflect.get(t, p, r);
      },
    }),
  };
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("buildGrowthExecutiveSummary", () => {
  it("returns a compact summary without throwing", async () => {
    const s = await buildGrowthExecutiveSummary();
    expect(s.status).toMatch(/weak|watch|healthy|strong/);
    expect(s.createdAt).toBeTruthy();
    expect(s.topPriorities.length).toBeLessThanOrEqual(5);
    expect(s.campaignSummary.adsPerformance).toBe("OK");
  });

  it("degrades when autopilot payload fails", async () => {
    const { listAutopilotActionsWithStatus } = await import("../ai-autopilot-api.helpers");
    vi.mocked(listAutopilotActionsWithStatus).mockRejectedValueOnce(new Error("x"));
    const s = await buildGrowthExecutiveSummary();
    expect(s.autopilot).toBeUndefined();
  });
});
