import { describe, expect, it, vi } from "vitest";
import { evaluateCandidatesAgainstAutonomyPolicies } from "./autonomous-policy-orchestrator.service";

vi.mock("@/modules/ai-autopilot/policies/autopilot-mode.service", () => ({
  getEffectiveAutopilotMode: vi.fn().mockResolvedValue("ASSIST"),
  modeAllowsSafeAuto: vi.fn().mockReturnValue(false),
}));

describe("autonomous-policy-orchestrator.service", () => {
  it("ASSIST mode keeps actionable items in monitorOnly", async () => {
    const row = {
      assistant: {
        id: "1",
        source: "ADS",
        actionType: "TEST_NEW_VARIANT",
        targetId: "e1",
        targetLabel: null,
        title: "t",
        summary: "long summary text here",
        reason: "r",
        confidenceScore: 0.8,
        confidenceLabel: "HIGH",
        evidenceScore: 0.7,
        evidenceQuality: "HIGH",
        expectedImpact: null,
        operatorAction: null,
        blockers: [],
        warnings: [],
        metrics: {},
        createdAt: new Date().toISOString(),
      },
      candidate: {
        recommendationId: "1",
        source: "ADS" as const,
        actionType: "TEST_NEW_VARIANT",
        trustScore: 0.8,
        confidenceScore: 0.8,
        priorityScore: 40,
        autonomyMode: "ASSIST",
        policyAllowed: true,
        requiresApproval: false,
        requiresSimulation: false,
        warnings: [],
        blockers: [],
      },
    };
    const { buckets } = await evaluateCandidatesAgainstAutonomyPolicies([row as never]);
    expect(buckets.monitorOnly.length).toBe(1);
    expect(buckets.executableNow.length).toBe(0);
  });
});
