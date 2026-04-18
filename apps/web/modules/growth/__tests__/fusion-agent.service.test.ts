import { describe, expect, it } from "vitest";
import { buildFusionAgentProposals } from "../agents/fusion-agent.service";
import type { AgentCoordinationContext } from "../growth-agents.types";

describe("buildFusionAgentProposals", () => {
  it("maps fusion actions to proposals", () => {
    const ctx: AgentCoordinationContext = {
      adsInsights: null,
      leadsToday: 0,
      totalEarlyLeads: 0,
      governance: null,
      fusionActions: [
        {
          id: "fa1",
          title: "Fusion action",
          description: "desc",
          source: "leads",
          impact: "high",
          confidence: 0.7,
          priorityScore: 80,
          why: "because",
          executionMode: "approval_required",
        },
      ],
      fusionSummary: null,
      dueNowCount: 0,
      hotLeadCount: 0,
      crmLeadTotal: 5,
      messagingAssistEnabled: false,
      contentAssistEnabled: false,
    };
    const p = buildFusionAgentProposals(ctx);
    expect(p[0]!.agentId).toBe("fusion_agent");
  });
});
