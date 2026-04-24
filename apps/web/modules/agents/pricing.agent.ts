import { AgentType, type AgentDecision, MAX_AGENT_CONFIDENCE } from "@/modules/agents/agent.types";
import type { ListingAgentContext } from "@/modules/agents/agent-context.service";

export function runPricingAgent(ctx: ListingAgentContext): AgentDecision {
  const baseline = ctx.price ?? 0;
  const suggested =
    baseline > 0 && ctx.daysOnMarket != null && ctx.daysOnMarket > 21
      ? Math.round(baseline * 0.97)
      : baseline > 0
        ? Math.round(baseline * 1.01)
        : baseline;
  const deltaPct = baseline > 0 ? ((suggested - baseline) / baseline) * 100 : 0;
  const confidence = Math.min(0.55 + Math.min(ctx.daysOnMarket ?? 0, 30) / 200, MAX_AGENT_CONFIDENCE);

  return {
    agentType: AgentType.PRICING_AGENT,
    entityId: ctx.listingId,
    entityKind: "listing",
    decisionType: "PRICE_ADJUSTMENT_SUGGESTION",
    payload: {
      currentPrice: baseline,
      suggestedPrice: suggested,
      suggestedDeltaPct: Math.round(deltaPct * 100) / 100,
      basis: ctx.daysOnMarket != null && ctx.daysOnMarket > 21 ? "stale_inventory_soft_cut" : "light_market_alignment",
    },
    confidence,
    reasoning:
      ctx.daysOnMarket != null && ctx.daysOnMarket > 21
        ? "Listing age elevated — bounded downward nudge only; broker must approve any publish."
        : "Minor alignment nudge within safe band; no auto-publish.",
  };
}
