import { describe, expect, it, vi, beforeEach } from "vitest";
import { coordinateGrowthAgents } from "../growth-agent-coordinator.service";
import { resetGrowthAgentMonitoringForTests } from "../growth-agent-monitoring.service";

vi.mock("@/config/feature-flags", () => ({
  growthMultiAgentFlags: {
    growthMultiAgentV1: true,
    growthAgentConflictV1: true,
    growthAgentAlignmentV1: true,
  },
  growthGovernanceFlags: { growthGovernanceV1: false },
  growthFusionFlags: {
    growthFusionV1: false,
    growthFusionAutopilotBridgeV1: false,
    growthFusionContentBridgeV1: false,
    growthFusionInfluenceBridgeV1: false,
  },
  aiAutopilotMessagingAssistFlags: { messagingAssistV1: false },
  aiAutopilotContentAssistFlags: { contentAssistV1: false },
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    lead: {
      count: vi.fn().mockResolvedValue(20),
      findMany: vi.fn().mockResolvedValue([]),
    },
  },
}));

vi.mock("../growth-ai-analyzer.service", () => ({
  fetchEarlyConversionAdsSnapshot: vi.fn().mockResolvedValue({
    campaignCounts: [{ label: "c", count: 3 }],
    totalLeads: 10,
    leadsWithUtmCampaign: 2,
    leadsToday: 1,
    topCampaign: { label: "c", count: 3 },
  }),
  computePaidFunnelAdsInsights: vi.fn().mockReturnValue({
    problems: [],
    opportunities: ["scale winning campaign (c)"],
    health: "OK",
  }),
}));

vi.mock("../ai-autopilot-followup.service", () => ({
  buildFollowUpQueue: vi.fn().mockReturnValue([]),
  leadRowToFollowUpInput: vi.fn(),
}));

vi.mock("../growth-agent-monitoring.service", async (orig) => {
  const m = await orig<typeof import("../growth-agent-monitoring.service")>();
  return {
    ...m,
    logGrowthAgentCoordinationStarted: vi.fn(),
    recordGrowthAgentCoordination: vi.fn(),
  };
});

beforeEach(() => {
  resetGrowthAgentMonitoringForTests();
});

describe("coordinateGrowthAgents", () => {
  it("returns coordination result", async () => {
    const r = await coordinateGrowthAgents();
    expect(r).not.toBeNull();
    expect(r!.proposals.length).toBeGreaterThan(0);
    expect(r!.topPriorities.length).toBeLessThanOrEqual(5);
  });
});
