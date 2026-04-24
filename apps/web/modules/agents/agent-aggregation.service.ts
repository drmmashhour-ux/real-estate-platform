import {
  AgentType,
  type AgentConflict,
  type AgentDecision,
  type AggregatedDecision,
  type ProposedAction,
} from "@/modules/agents/agent.types";

function decisionToAction(d: AgentDecision): ProposedAction {
  return {
    agentType: d.agentType,
    kind: d.decisionType,
    payload: d.payload,
    confidence: d.confidence,
    reasoning: d.reasoning,
  };
}

function detectConflicts(decisions: AgentDecision[]): AgentConflict[] {
  const conflicts: AgentConflict[] = [];
  const price = decisions.find((d) => d.agentType === AgentType.PRICING_AGENT);
  const rank = decisions.find((d) => d.agentType === AgentType.RANKING_AGENT);

  const priceUp =
    price &&
    typeof price.payload.suggestedDeltaPct === "number" &&
    (price.payload.suggestedDeltaPct as number) > 0.5;
  const priceDown =
    price &&
    typeof price.payload.suggestedDeltaPct === "number" &&
    (price.payload.suggestedDeltaPct as number) < -0.5;
  const rankBoost = rank?.payload.signal === "boost";
  const rankDemote = rank?.payload.signal === "demote";

  if (priceDown && rankBoost) {
    conflicts.push({
      id: "price_down_vs_rank_boost",
      summary: "Pricing suggests soft cut while ranking suggests boost — reconcile with broker.",
      agentTypes: [AgentType.PRICING_AGENT, AgentType.RANKING_AGENT],
    });
  }
  if (priceUp && rankDemote) {
    conflicts.push({
      id: "price_up_vs_rank_demote",
      summary: "Pricing nudges up while ranking suggests demotion — verify engagement narrative.",
      agentTypes: [AgentType.PRICING_AGENT, AgentType.RANKING_AGENT],
    });
  }

  return conflicts;
}

export function aggregateAgentDecisions(decisions: AgentDecision[]): AggregatedDecision {
  const conflicts = detectConflicts(decisions);
  const conflicted = new Set(conflicts.flatMap((c) => c.agentTypes));
  const actions = decisions
    .filter((d) => !conflicted.has(d.agentType))
    .map(decisionToAction);

  const meanConf =
    actions.length > 0 ? actions.reduce((s, a) => s + a.confidence, 0) / actions.length : 0;

  return {
    actions,
    conflicts,
    confidenceScore: Math.round(meanConf * 1000) / 1000,
  };
}
