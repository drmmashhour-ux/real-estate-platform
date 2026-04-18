import { describe, expect, it } from "vitest";
import { buildCroAgentProposals } from "../agents/cro-agent.service";
import type { AgentCoordinationContext } from "../growth-agents.types";

describe("buildCroAgentProposals", () => {
  it("returns at least one proposal with partial fusion", () => {
    const ctx: AgentCoordinationContext = {
      adsInsights: { problems: [], opportunities: [], health: "WEAK" },
      leadsToday: 0,
      totalEarlyLeads: 20,
      governance: null,
      fusionActions: [],
      fusionSummary: {
        status: "moderate",
        topProblems: ["conversion path friction on CTA"],
        topOpportunities: [],
        topActions: [],
        confidence: 0.5,
        signals: [],
        grouped: { leads: [], ads: [], cro: [], content: [], autopilot: [] },
        createdAt: new Date().toISOString(),
      },
      dueNowCount: 0,
      hotLeadCount: 0,
      crmLeadTotal: 20,
      messagingAssistEnabled: false,
      contentAssistEnabled: false,
    };
    const p = buildCroAgentProposals(ctx);
    expect(p.length).toBeGreaterThan(0);
  });
});
