/**
 * Thin integration surface — existing engines submit a normalized candidate without importing heavy modules.
 */
import type { AutopilotCandidateContext } from "@/modules/autopilot-execution/autopilot-execution.types";
import { submitAutopilotCandidate } from "@/modules/autopilot-execution/autopilot-execution.service";

/** Optional entry used by marketing, growth, broker assistant, booking, deals, etc. */
export async function emitLecipmAutopilotCandidate(input: AutopilotCandidateContext) {
  return submitAutopilotCandidate(input);
}

export function buildMarketingDraftCandidate(payload: {
  fingerprint: string;
  title: string;
  summary: string;
  draft: unknown;
}): AutopilotCandidateContext {
  return {
    domain: "marketing_content_generation",
    sourceSystem: "marketing_engine",
    actionType: "marketing.draft.email",
    title: payload.title,
    summary: payload.summary,
    candidatePayload: payload.draft as object,
    fingerprint: payload.fingerprint,
  };
}

export function buildLeadRouteCandidate(payload: {
  leadId: string;
  brokerId: string;
}): AutopilotCandidateContext {
  return {
    domain: "lead_routing",
    sourceSystem: "crm_router",
    actionType: "lead.route",
    title: "Route lead to broker",
    summary: `Lead ${payload.leadId} → broker ${payload.brokerId}`,
    candidatePayload: payload as object,
    fingerprint: `lead:${payload.leadId}`,
  };
}

export function buildBookingSuggestCandidate(payload: { listingId: string; slots: string[] }): AutopilotCandidateContext {
  return {
    domain: "booking_slot_suggestion",
    sourceSystem: "booking_system",
    actionType: "booking.suggest_slots",
    title: "Suggest booking slots",
    summary: `Listing ${payload.listingId}`,
    candidatePayload: payload as object,
    fingerprint: `booking:${payload.listingId}:${payload.slots.join(",")}`,
  };
}

/** Growth Brain → orchestrator */
export function buildGrowthBrainSignalCandidate(payload: { territoryId: string; signal: unknown }): AutopilotCandidateContext {
  return {
    domain: "marketing_scheduling",
    sourceSystem: "growth_brain",
    actionType: "dashboard.summary",
    title: "Growth signal digest",
    summary: `Territory ${payload.territoryId}`,
    candidatePayload: payload.signal as object,
    fingerprint: `growth:${payload.territoryId}`,
  };
}

/** Broker assistant safe one-click */
export function buildBrokerAssistantSafeCandidate(payload: { actionKey: string; payload: unknown }): AutopilotCandidateContext {
  return {
    domain: "broker_assistant_actions",
    sourceSystem: "broker_assistant",
    actionType: `assistant.safe_action.${payload.actionKey}`,
    title: "Assistant safe action",
    summary: payload.actionKey,
    candidatePayload: payload.payload as object,
  };
}

/** Marketplace optimizer — proposals still approval-gated in matrix */
export function buildMarketplaceOptimizationCandidate(params: {
  fingerprint: string;
  title: string;
  summary: string;
  proposedPayload: unknown;
}): AutopilotCandidateContext {
  return {
    domain: "marketplace_optimization_proposals",
    sourceSystem: "marketplace_optimizer",
    actionType: "dashboard.summary",
    title: params.title,
    summary: params.summary,
    candidatePayload: params.proposedPayload as object,
    fingerprint: params.fingerprint,
    policyContext: { complianceSensitive: true },
  };
}
