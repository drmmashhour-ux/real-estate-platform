import { describe, expect, it } from "vitest";
import { buildGovernanceAgentProposals } from "../agents/governance-agent.service";
import type { AgentCoordinationContext } from "../growth-agents.types";

describe("buildGovernanceAgentProposals", () => {
  it("maps governance decision to proposals", () => {
    const ctx: AgentCoordinationContext = {
      adsInsights: null,
      leadsToday: 0,
      totalEarlyLeads: 0,
      governance: {
        status: "watch",
        topRisks: [
          {
            id: "r1",
            category: "ads",
            severity: "medium",
            title: "Test risk",
            description: "d",
            reason: "r",
          },
        ],
        blockedDomains: [],
        frozenDomains: [],
        humanReviewItems: [],
        humanReviewQueue: [],
        notes: [],
        createdAt: new Date().toISOString(),
      },
      fusionActions: [],
      fusionSummary: null,
      dueNowCount: 0,
      hotLeadCount: 0,
      crmLeadTotal: 5,
      messagingAssistEnabled: false,
      contentAssistEnabled: false,
    };
    const p = buildGovernanceAgentProposals(ctx);
    expect(p.some((x) => x.agentId === "governance_agent")).toBe(true);
  });
});
