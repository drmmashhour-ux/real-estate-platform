import { AgentType, type AgentDecision, MAX_AGENT_CONFIDENCE } from "@/modules/agents/agent.types";
import type { DealAgentContext } from "@/modules/agents/agent-context.service";

const STAGE_ORDER = [
  "initiated",
  "offer_submitted",
  "accepted",
  "inspection",
  "financing",
  "closing_scheduled",
  "closed",
];

export function runDealAgent(ctx: DealAgentContext): AgentDecision {
  const idx = STAGE_ORDER.indexOf(ctx.status);
  const next = idx >= 0 && idx < STAGE_ORDER.length - 1 ? STAGE_ORDER[idx + 1] : ctx.status;
  return {
    agentType: AgentType.DEAL_AGENT,
    entityId: ctx.dealId,
    entityKind: "deal",
    decisionType: "NEXT_DEAL_ACTION_SUGGESTION",
    payload: {
      currentStage: ctx.status,
      suggestedStage: next,
      checklist: ["Confirm deposit trail", "Verify inspection window", "Update CRM milestones"],
      automationForbidden: true,
    },
    confidence: Math.min(0.58 + (ctx.milestoneOpenCount ?? 0) * 0.04, MAX_AGENT_CONFIDENCE),
    reasoning:
      "Suggests next operational checkpoint only — no status mutation without broker approval.",
  };
}
