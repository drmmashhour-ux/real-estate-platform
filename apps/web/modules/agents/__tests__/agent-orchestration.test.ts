import { describe, expect, it, vi } from "vitest";
import { AgentType } from "@/modules/agents/agent.types";
import { aggregateAgentDecisions } from "@/modules/agents/agent-aggregation.service";
import { runPricingAgent } from "@/modules/agents/pricing.agent";
import { runRankingAgent } from "@/modules/agents/ranking.agent";
import { evaluateAgentPolicySafety } from "@/modules/agents/agent-policy-gate.service";

vi.mock("@/modules/evolution/evolution-logger", () => ({
  logEvolution: vi.fn(),
}));

describe("multi-agent coordination", () => {
  it("agents produce bounded decisions", () => {
    const ctx = {
      listingId: "l1",
      title: "Test",
      price: 500_000,
      ownerId: "u1",
      daysOnMarket: 25,
      completenessScore: 0.8,
      messageResponseRate: null,
      isCoOwnership: false,
    };
    const p = runPricingAgent(ctx);
    expect(p.agentType).toBe(AgentType.PRICING_AGENT);
    expect(p.confidence).toBeLessThanOrEqual(0.92);
    const r = runRankingAgent(ctx);
    expect(r.payload.signal).toBeDefined();
  });

  it("aggregation detects price vs ranking conflict", () => {
    const decisions = [
      {
        agentType: AgentType.PRICING_AGENT,
        entityId: "l1",
        entityKind: "listing" as const,
        decisionType: "PRICE_ADJUSTMENT_SUGGESTION",
        payload: { suggestedDeltaPct: -4 },
        confidence: 0.7,
        reasoning: "cut",
      },
      {
        agentType: AgentType.RANKING_AGENT,
        entityId: "l1",
        entityKind: "listing" as const,
        decisionType: "RANKING_BOOST_SUGGESTION",
        payload: { signal: "boost" },
        confidence: 0.7,
        reasoning: "boost",
      },
    ];
    const agg = aggregateAgentDecisions(decisions);
    expect(agg.conflicts.length).toBeGreaterThan(0);
    expect(agg.actions.length).toBe(0);
  });

  it("policy evaluation returns structured gate", () => {
    const gate = evaluateAgentPolicySafety([]);
    expect(typeof gate.allowed).toBe("boolean");
    expect(typeof gate.blocked).toBe("boolean");
    expect(typeof gate.requiresHumanApproval).toBe("boolean");
  });
});
