import { describe, expect, it } from "vitest";
import { detectGrowthAgentAlignments } from "../growth-agent-alignment.service";
import type { GrowthAgentProposal } from "../growth-agents.types";

const now = new Date().toISOString();

describe("detectGrowthAgentAlignments", () => {
  it("groups follow-up themes", () => {
    const proposals: GrowthAgentProposal[] = [
      {
        id: "l1",
        agentId: "leads_agent",
        title: "Follow-up due queue",
        description: "d",
        domain: "leads",
        impact: "high",
        confidence: 0.6,
        rationale: "hot",
        createdAt: now,
      },
      {
        id: "m1",
        agentId: "messaging_agent",
        title: "Draft for due follow-ups",
        description: "d",
        domain: "messaging",
        impact: "medium",
        confidence: 0.55,
        rationale: "due",
        createdAt: now,
      },
    ];
    const a = detectGrowthAgentAlignments(proposals);
    expect(a.length).toBeGreaterThan(0);
    expect(a[0]!.theme).toContain("follow");
  });
});
