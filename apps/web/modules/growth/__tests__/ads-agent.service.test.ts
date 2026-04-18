import { describe, expect, it } from "vitest";
import { buildAdsAgentProposals } from "../agents/ads-agent.service";
import type { AgentCoordinationContext } from "../growth-agents.types";

const baseCtx = (ins: AgentCoordinationContext["adsInsights"]): AgentCoordinationContext => ({
  adsInsights: ins,
  leadsToday: 1,
  totalEarlyLeads: 10,
  governance: null,
  fusionActions: [],
  fusionSummary: null,
  dueNowCount: 0,
  hotLeadCount: 0,
  crmLeadTotal: 10,
  messagingAssistEnabled: false,
  contentAssistEnabled: false,
});

describe("buildAdsAgentProposals", () => {
  it("returns bounded proposals from opportunities and problems", () => {
    const p = buildAdsAgentProposals(
      baseCtx({
        problems: ["campaign underperforming (x)"],
        opportunities: ["scale winning campaign (y)"],
        health: "OK",
      }),
    );
    expect(p.length).toBeGreaterThan(0);
    expect(p.length).toBeLessThanOrEqual(5);
    expect(p.every((x) => x.agentId === "ads_agent")).toBe(true);
  });

  it("handles null insights safely", () => {
    const p = buildAdsAgentProposals(baseCtx(null));
    expect(p.length).toBe(1);
    expect(p[0]!.requiresHumanReview).toBe(true);
  });
});
