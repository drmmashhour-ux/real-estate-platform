import { describe, expect, it } from "vitest";
import { resolveGrowthAgentPriorities } from "../growth-agent-priority.service";
import type { GrowthAgentConflict, GrowthAgentProposal, GrowthAgentAlignment } from "../growth-agents.types";

const now = new Date().toISOString();

describe("resolveGrowthAgentPriorities", () => {
  it("returns at most five and penalizes high-severity conflicts", () => {
    const proposals: GrowthAgentProposal[] = [
      {
        id: "p1",
        agentId: "ads_agent",
        title: "A",
        description: "",
        domain: "ads",
        impact: "high",
        confidence: 0.9,
        priorityScore: 90,
        rationale: "",
        createdAt: now,
      },
      {
        id: "p2",
        agentId: "leads_agent",
        title: "B",
        description: "",
        domain: "leads",
        impact: "medium",
        confidence: 0.8,
        priorityScore: 85,
        rationale: "",
        createdAt: now,
      },
    ];
    const conflicts: GrowthAgentConflict[] = [
      { id: "c1", proposalIds: ["p1"], reason: "x", severity: "high" },
    ];
    const alignments: GrowthAgentAlignment[] = [
      { id: "a1", proposalIds: ["p2"], theme: "t", confidence: 0.8 },
    ];
    const top = resolveGrowthAgentPriorities(proposals, conflicts, alignments);
    expect(top.length).toBeLessThanOrEqual(5);
  });
});
