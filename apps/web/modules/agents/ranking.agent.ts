import { AgentType, type AgentDecision, MAX_AGENT_CONFIDENCE } from "@/modules/agents/agent.types";
import type { ListingAgentContext } from "@/modules/agents/agent-context.service";

export function runRankingAgent(ctx: ListingAgentContext): AgentDecision {
  const boost =
    (ctx.completenessScore ?? 0.5) > 0.75 && (ctx.daysOnMarket ?? 0) < 14;
  const demote = (ctx.daysOnMarket ?? 0) > 45 && (ctx.messageResponseRate ?? 1) < 0.4;
  let decisionType = "RANKING_HOLD";
  const payload: Record<string, unknown> = { signal: "neutral" };
  let reasoning = "No strong ranking delta — hold current posture.";

  if (boost && !demote) {
    decisionType = "RANKING_BOOST_SUGGESTION";
    payload.signal = "boost";
    payload.maxBoostBps = 50;
    reasoning = "Quality + freshness support a small visibility boost proposal (policy-capped).";
  } else if (demote) {
    decisionType = "RANKING_DEMOTE_SUGGESTION";
    payload.signal = "demote";
    payload.suggestedDemoteBps = 30;
    reasoning = "Stale listing + weak engagement — suggest demotion pending broker review.";
  }

  return {
    agentType: AgentType.RANKING_AGENT,
    entityId: ctx.listingId,
    entityKind: "listing",
    decisionType,
    payload,
    confidence: Math.min(0.5 + (ctx.completenessScore ?? 0) * 0.35, MAX_AGENT_CONFIDENCE),
    reasoning,
  };
}
