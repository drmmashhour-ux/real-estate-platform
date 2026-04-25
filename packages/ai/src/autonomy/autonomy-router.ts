import type { AgentKey } from "../types";
import type { AgentObservation } from "@/lib/ai/agents/agent-runtime";

export type AutonomyGoal = {
  id: string;
  label: string;
  agentKey: AgentKey;
  entityType?: string;
  entityId?: string;
};

/** Map coarse observations to default owning agent (deterministic, no LLM). */
export function routeGoalFromObservation(obs: AgentObservation): AutonomyGoal {
  const tags = obs.signals.tags;
  if (Array.isArray(tags) && tags.includes("booking_stall")) {
    return { id: "g_booking", label: "Unblock booking flow", agentKey: "booking_ops" };
  }
  if (Array.isArray(tags) && tags.includes("listing_incomplete")) {
    return { id: "g_listing", label: "Improve listing completeness", agentKey: "listing_optimization" };
  }
  if (Array.isArray(tags) && tags.includes("payout")) {
    return { id: "g_payout", label: "Payout readiness", agentKey: "host_management" };
  }
  return { id: "g_default", label: "Operational assist", agentKey: "admin_insights" };
}
