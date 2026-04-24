import { logEvolution } from "@/modules/evolution/evolution-logger";
import type { AgentType } from "@/modules/agents/agent.types";

/** Links coordination runs into evolution telemetry (outcome linking stays separate). */
export function logAgentStrategyApplied(meta: {
  agentType: AgentType;
  entityKind: string;
  entityId: string;
  decisionType: string;
  confidence?: number;
}): void {
  logEvolution("strategy_applied", {
    agentType: meta.agentType,
    entityKind: meta.entityKind,
    entityId: meta.entityId,
    decisionType: meta.decisionType,
    confidence: meta.confidence ?? null,
    layer: "multi_agent_coordination",
  });
}
