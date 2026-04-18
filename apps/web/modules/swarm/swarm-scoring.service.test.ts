import { describe, expect, it } from "vitest";
import { computeSwarmAggregateScores } from "./swarm-scoring.service";
import type { SwarmProposal } from "./swarm-system.types";

function p(over: Partial<SwarmProposal>): SwarmProposal {
  return {
    id: "x",
    agentId: "ads",
    role: "performance",
    sourceSystems: ["ads"],
    recommendationType: "monitor",
    confidence: 0.5,
    priority: 0.5,
    risk: 0.5,
    evidenceQuality: 0.5,
    blockers: [],
    dependencies: [],
    rationale: "r",
    suggestedNextAction: "a",
    freshnessAt: new Date().toISOString(),
    ...over,
  };
}

describe("computeSwarmAggregateScores", () => {
  it("returns bounded finite scores for empty input", () => {
    const s = computeSwarmAggregateScores([]);
    expect(s.swarmConfidence).toBe(0.5);
    expect(Number.isFinite(s.executionSuitability)).toBe(true);
  });

  it("aggregates multiple proposals", () => {
    const s = computeSwarmAggregateScores([p({ confidence: 0.8 }), p({ confidence: 0.4 })]);
    expect(s.swarmConfidence).toBeCloseTo(0.6, 5);
  });
});
