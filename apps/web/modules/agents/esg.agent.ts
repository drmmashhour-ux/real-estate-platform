import { AgentType, type AgentDecision, MAX_AGENT_CONFIDENCE } from "@/modules/agents/agent.types";
import type { ListingAgentContext } from "@/modules/agents/agent-context.service";

export function runEsgAgent(ctx: ListingAgentContext): AgentDecision {
  const isCoOwn = ctx.isCoOwnership === true;
  return {
    agentType: AgentType.ESG_AGENT,
    entityId: ctx.listingId,
    entityKind: "listing",
    decisionType: "RETROFIT_PRIORITIZATION_SUGGESTION",
    payload: {
      priority: isCoOwn ? "energy_audit_and_reserve_study" : "baseline_disclosure_pack",
      suggestedActions: isCoOwn
        ? ["Schedule energy benchmarking", "Document retrofit payback for board pack"]
        : ["Attach green disclosure checklist", "Flag utility trends for buyer diligence"],
      bounded: true,
    },
    confidence: Math.min(isCoOwn ? 0.72 : 0.55, MAX_AGENT_CONFIDENCE),
    reasoning:
      "Prioritization is advisory; capital plans and contracts remain human-approved.",
  };
}
