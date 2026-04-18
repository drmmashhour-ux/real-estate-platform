import { describe, expect, it } from "vitest";
import { buildLeadsAgentProposals } from "../agents/leads-agent.service";
import type { AgentCoordinationContext } from "../growth-agents.types";

const empty: AgentCoordinationContext = {
  adsInsights: null,
  leadsToday: 0,
  totalEarlyLeads: 0,
  governance: null,
  fusionActions: [],
  fusionSummary: null,
  dueNowCount: 3,
  hotLeadCount: 5,
  crmLeadTotal: 100,
  messagingAssistEnabled: false,
  contentAssistEnabled: false,
};

describe("buildLeadsAgentProposals", () => {
  it("surfaces due queue when present", () => {
    const p = buildLeadsAgentProposals(empty);
    expect(p.some((x) => x.title.toLowerCase().includes("due"))).toBe(true);
  });
});
