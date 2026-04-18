import { describe, expect, it } from "vitest";
import { buildMessagingAgentProposals } from "../agents/messaging-agent.service";
import type { AgentCoordinationContext } from "../growth-agents.types";

describe("buildMessagingAgentProposals", () => {
  it("proposes drafts when assist enabled and due items exist", () => {
    const ctx: AgentCoordinationContext = {
      adsInsights: null,
      leadsToday: 0,
      totalEarlyLeads: 0,
      governance: null,
      fusionActions: [],
      fusionSummary: null,
      dueNowCount: 2,
      hotLeadCount: 1,
      crmLeadTotal: 10,
      messagingAssistEnabled: true,
      contentAssistEnabled: false,
    };
    const p = buildMessagingAgentProposals(ctx);
    expect(p[0]!.domain).toBe("messaging");
    expect(p[0]!.title.toLowerCase()).toContain("draft");
  });
});
