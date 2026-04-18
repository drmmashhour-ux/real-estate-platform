import { describe, expect, it } from "vitest";
import { detectGrowthAgentConflicts } from "../growth-agent-conflict.service";
import type { GrowthAgentProposal } from "../growth-agents.types";

const now = new Date().toISOString();

function p(partial: Partial<GrowthAgentProposal>): GrowthAgentProposal {
  return {
    id: partial.id ?? "x",
    agentId: partial.agentId ?? "ads_agent",
    title: partial.title ?? "t",
    description: partial.description ?? "d",
    domain: partial.domain ?? "ads",
    impact: partial.impact ?? "medium",
    confidence: partial.confidence ?? 0.5,
    rationale: partial.rationale ?? "r",
    createdAt: now,
    ...partial,
  };
}

describe("detectGrowthAgentConflicts", () => {
  it("detects scale vs cro tension", () => {
    const proposals = [
      p({ id: "a1", agentId: "ads_agent", title: "Consider scaling opportunity", domain: "ads" }),
      p({
        id: "c1",
        agentId: "cro_agent",
        title: "Fix conversion funnel",
        domain: "cro",
        rationale: "conversion path",
      }),
    ];
    const c = detectGrowthAgentConflicts(proposals);
    expect(c.length).toBeGreaterThan(0);
  });

  it("returns empty for unrelated proposals", () => {
    const proposals = [
      p({ id: "l1", agentId: "leads_agent", title: "Stable", domain: "leads" }),
    ];
    expect(detectGrowthAgentConflicts(proposals).length).toBe(0);
  });
});
