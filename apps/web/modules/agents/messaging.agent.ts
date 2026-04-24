import { AgentType, type AgentDecision, MAX_AGENT_CONFIDENCE } from "@/modules/agents/agent.types";
import type { ConversationAgentContext } from "@/modules/agents/agent-context.service";

export function runMessagingAgent(ctx: ConversationAgentContext): AgentDecision {
  const backlog = ctx.unreadOrQueued ?? 0;
  const decisionType =
    backlog > 3 ? "REPLY_STRATEGY_ESCALATE" : backlog > 0 ? "REPLY_STRATEGY_STANDARD" : "REPLY_STRATEGY_NURTURE";

  return {
    agentType: AgentType.MESSAGING_AGENT,
    entityId: ctx.conversationId,
    entityKind: "conversation",
    decisionType,
    payload: {
      draftOnly: true,
      suggestedTone: backlog > 3 ? "concise_factual" : "warm_professional",
      followUpWithinHours: backlog > 3 ? 4 : 24,
      queueDepth: backlog,
    },
    confidence: Math.min(0.45 + Math.min(backlog, 10) * 0.04, MAX_AGENT_CONFIDENCE),
    reasoning:
      "Outputs are draft suggestions only — send path must remain human-controlled with policy checks.",
  };
}
