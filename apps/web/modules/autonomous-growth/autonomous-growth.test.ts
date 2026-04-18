import { describe, expect, it, vi } from "vitest";
import { unifyAutonomousRecommendations } from "./autonomous-decision-unifier.service";
import { buildPrioritizedAutonomousCandidates } from "./autonomous-priority.service";
import { evaluateCandidatesAgainstAutonomyPolicies } from "./autonomous-policy-orchestrator.service";
import { simulateAutonomousCandidates } from "./autonomous-simulation.service";
import { snapshotFromBuckets } from "./autonomous-growth.orchestrator";

vi.mock("@/modules/ai-autopilot/policies/autopilot-mode.service", () => ({
  getEffectiveAutopilotMode: vi.fn().mockResolvedValue("SAFE_AUTOPILOT"),
  modeAllowsSafeAuto: vi.fn().mockReturnValue(true),
}));

describe("autonomous growth V7", () => {
  it("unifier normalizes candidates with metadata", () => {
    const obs = {
      snapshot: {
        observedAt: new Date().toISOString(),
        domains: ["ADS" as const],
        recommendationCount: 1,
        decisionCount: 0,
        executableCount: 1,
        blockedCount: 0,
        approvalRequiredCount: 0,
        warnings: [],
      },
      raw: {
        assistantFeed: {
          topRecommendations: [
            {
              id: "a1",
              source: "ADS",
              actionType: "MONITOR",
              targetId: "c1",
              targetLabel: null,
              title: "t",
              summary: "summary text here",
              reason: "r",
              confidenceScore: 0.7,
              confidenceLabel: "HIGH",
              evidenceScore: null,
              evidenceQuality: null,
              expectedImpact: null,
              operatorAction: null,
              blockers: [],
              warnings: [],
              metrics: {},
              createdAt: new Date().toISOString(),
            },
          ],
          blockedRecommendations: [],
          monitoringOnly: [],
          summaryCounts: { total: 1, top: 1, blocked: 0, conflicts: 0, monitoring: 0 },
          subsystemWarnings: [],
          persistWarnings: [],
        },
        brainSnapshot: null,
        platformCoreHealth: null,
        latestPortfolioRun: null,
      },
    };
    const rows = unifyAutonomousRecommendations({ observation: obs as never });
    expect(rows).toHaveLength(1);
    expect(rows[0]!.candidate.metadata?.title).toBe("t");
  });

  it("prioritization returns empty deterministically", async () => {
    const pri = await buildPrioritizedAutonomousCandidates([]);
    expect(pri.ordered).toEqual([]);
    expect(pri.dropped).toEqual([]);
  });

  it("simulation summary is safe on empty input", async () => {
    const r = await simulateAutonomousCandidates([]);
    expect(r.label).toBe("estimate");
    expect(r.operator).toBeNull();
  });

  it("snapshotFromBuckets merges counts", () => {
    const snap = snapshotFromBuckets(
      {
        observedAt: "",
        domains: [],
        recommendationCount: 3,
        decisionCount: 0,
        executableCount: 0,
        blockedCount: 0,
        approvalRequiredCount: 0,
        warnings: [],
      },
      {
        executableNow: [],
        approvalRequired: [{ candidate: { recommendationId: "a" } } as never],
        blocked: [{ candidate: { recommendationId: "b" } } as never],
        simulationRequired: [],
        monitorOnly: [],
      },
    );
    expect(snap.executableCount).toBe(0);
    expect(snap.blockedCount).toBe(1);
    expect(snap.approvalRequiredCount).toBe(1);
  });

  it("policy: external budget actions route to approval, not executable", async () => {
    const row = {
      assistant: {
        id: "1",
        source: "ADS",
        actionType: "SCALE_CAMPAIGN",
        targetId: "c",
        targetLabel: null,
        title: "scale",
        summary: "long summary text here",
        reason: "because",
        confidenceScore: 0.9,
        confidenceLabel: "HIGH",
        evidenceScore: 0.8,
        evidenceQuality: "HIGH",
        expectedImpact: null,
        operatorAction: null,
        blockers: [],
        warnings: [],
        metrics: { estimatedSpend: 100, cpl: 2 },
        createdAt: new Date().toISOString(),
      },
      candidate: {
        recommendationId: "1",
        source: "ADS" as const,
        actionType: "SCALE_CAMPAIGN",
        trustScore: 0.8,
        confidenceScore: 0.9,
        priorityScore: 50,
        autonomyMode: "SAFE_AUTOPILOT",
        policyAllowed: true,
        requiresApproval: false,
        requiresSimulation: false,
        warnings: [],
        blockers: [],
      },
    };
    const { buckets } = await evaluateCandidatesAgainstAutonomyPolicies([row as never]);
    expect(buckets.approvalRequired.length).toBe(1);
    expect(buckets.executableNow).toHaveLength(0);
  });
});
