import { describe, expect, it, vi, beforeEach } from "vitest";
import { runGrowthLearningCycle, resetGrowthLearningRunCounterForTests } from "../growth-learning.service";
import { resetGrowthLearningWeightsForTests } from "../growth-learning-weights.service";

vi.mock("@/config/feature-flags", () => ({
  growthLearningFlags: {
    growthLearningV1: true,
    growthLearningAdaptiveWeightsV1: true,
    growthLearningMonitoringV1: false,
  },
  growthGovernanceFlags: {
    growthGovernanceV1: false,
  },
  growthPolicyEnforcementFlags: {
    growthPolicyEnforcementV1: false,
    growthPolicyEnforcementPanelV1: false,
  },
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    lead: {
      count: vi.fn().mockResolvedValue(50),
      findMany: vi.fn().mockResolvedValue([]),
    },
  },
}));

vi.mock("../growth-ai-analyzer.service", () => ({
  fetchEarlyConversionAdsSnapshot: vi.fn().mockResolvedValue({
    campaignCounts: [
      { label: "c1", count: 10 },
      { label: "(no UTM)", count: 2 },
    ],
    totalLeads: 30,
    leadsWithUtmCampaign: 10,
    leadsToday: 2,
    topCampaign: { label: "c1", count: 10 },
  }),
  computePaidFunnelAdsInsights: vi.fn().mockReturnValue({
    problems: [],
    opportunities: [],
    health: "OK",
  }),
}));

vi.mock("../ai-autopilot-followup.service", () => ({
  buildFollowUpQueue: vi.fn().mockReturnValue([]),
  leadRowToFollowUpInput: vi.fn(),
}));

vi.mock("../growth-governance.service", () => ({
  evaluateGrowthGovernance: vi.fn().mockResolvedValue(null),
}));

vi.mock("../growth-governance-learning-monitoring.service", () => ({
  recordGrowthLearningControlEvaluation: vi.fn(),
}));

vi.mock("../ai-autopilot-execution-monitoring.service", () => ({
  getAutopilotMonitoringSnapshot: vi.fn().mockReturnValue({ failedCount: 0 }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  resetGrowthLearningWeightsForTests();
  resetGrowthLearningRunCounterForTests();
});

describe("runGrowthLearningCycle", () => {
  it("returns summary and weights without throwing", async () => {
    const r = await runGrowthLearningCycle();
    expect(r).not.toBeNull();
    expect(r!.summary.outcomesLinked).toBeGreaterThan(0);
    expect(r!.signals.length).toBeGreaterThan(0);
    expect(r!.adaptiveWeightsEnabled).toBe(true);
    expect(r!.learningControl.state).toMatch(/normal|monitor|freeze_recommended|reset_recommended/);
  });
});
