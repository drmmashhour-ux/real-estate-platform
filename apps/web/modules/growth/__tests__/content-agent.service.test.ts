import { describe, expect, it } from "vitest";
import { buildContentAgentProposals } from "../agents/content-agent.service";
import type { AgentCoordinationContext } from "../growth-agents.types";

describe("buildContentAgentProposals", () => {
  it("returns studio proposal when assist enabled", () => {
    const ctx: AgentCoordinationContext = {
      adsInsights: { problems: [], opportunities: ["x"], health: "OK" },
      leadsToday: 1,
      totalEarlyLeads: 5,
      governance: null,
      fusionActions: [],
      fusionSummary: null,
      dueNowCount: 0,
      hotLeadCount: 0,
      crmLeadTotal: 5,
      messagingAssistEnabled: false,
      contentAssistEnabled: true,
    };
    const p = buildContentAgentProposals(ctx);
    expect(p.some((x) => x.domain === "content")).toBe(true);
  });
});
