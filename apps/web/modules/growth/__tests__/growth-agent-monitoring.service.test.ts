import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  getGrowthAgentMonitoringSnapshot,
  recordGrowthAgentCoordination,
  resetGrowthAgentMonitoringForTests,
} from "../growth-agent-monitoring.service";

vi.mock("@/config/feature-flags", () => ({
  growthMultiAgentFlags: {
    growthMultiAgentV1: true,
    growthAgentConflictV1: true,
    growthAgentAlignmentV1: true,
  },
}));

describe("growth-agent-monitoring", () => {
  beforeEach(() => {
    resetGrowthAgentMonitoringForTests();
  });

  it("increments on record", () => {
    recordGrowthAgentCoordination({
      proposalCount: 4,
      conflictCount: 1,
      alignmentCount: 1,
      topPriorities: [
        {
          id: "t",
          agentId: "ads_agent",
          title: "T",
          description: "",
          domain: "ads",
          impact: "low",
          confidence: 0.5,
          rationale: "",
          createdAt: new Date().toISOString(),
        },
      ],
      missingAgentWarnings: 0,
    });
    const s = getGrowthAgentMonitoringSnapshot();
    expect(s.coordinationRuns).toBe(1);
    expect(s.proposalsGenerated).toBe(4);
  });
});
