import type { ProposedAction } from "../types/autonomy.types";

import { createProposedAction } from "../engine/autonomy-orchestrator.service";
import { isAutonomyOsActionsEnabled } from "../lib/autonomy-layer-gate";
import { logAutonomy } from "../lib/autonomy-log";

/** Internal-safe execution stubs — never sends guest-facing messages (marketing stays draft-only upstream). */
export async function executeAutonomyAction(
  action: ProposedAction,
): Promise<{ success: boolean; actionId: string; executedAt: string }> {
  logAutonomy("[autonomy:action:execute:start]", {
    actionId: action.id,
    domain: action.domain,
    type: action.type,
  });

  if (!isAutonomyOsActionsEnabled()) {
    logAutonomy("[autonomy:action:execute:done]", { actionId: action.id, success: false, reason: "feature_gate" });
    return {
      success: false,
      actionId: action.id,
      executedAt: new Date().toISOString(),
    };
  }

  if (action.status !== "APPROVED" && action.status !== "DRAFT") {
    return {
      success: false,
      actionId: action.id,
      executedAt: new Date().toISOString(),
    };
  }

  if (action.domain === "MARKETING") {
    logAutonomy("[autonomy:action:execute:skipped]", {
      actionId: action.id,
      reason: "marketing_draft_only_no_guest_send",
    });
  }

  logAutonomy("[autonomy:action:execute:done]", { actionId: action.id });

  return {
    success: true,
    actionId: action.id,
    executedAt: new Date().toISOString(),
  };
}

/** Draft / queue-only action templates — all subject to policy + human approval. */
export function draftPricingUpdateProposed(
  mode: ProposedAction["mode"],
  payload: Record<string, unknown>,
) {
  return createProposedAction({
    domain: "PRICING",
    type: "PRICING_UPDATE",
    title: "Adjust listing price",
    description: "Proposed price change from outcome-based engine (not auto-executed here).",
    mode,
    payload,
  });
}

export function draftPromotionRecommendationProposed(
  mode: ProposedAction["mode"],
  payload: Record<string, unknown>,
) {
  return createProposedAction({
    domain: "MARKETING",
    type: "PROMOTION_RECOMMENDATION",
    title: "Promotion recommendation",
    description: "Draft promotion parameters — no outbound send from this path.",
    mode,
    payload,
  });
}

export function draftContentOptimizationProposed(
  mode: ProposedAction["mode"],
  payload: Record<string, unknown>,
) {
  return createProposedAction({
    domain: "CONTENT",
    type: "CONTENT_OPTIMIZATION",
    title: "Content optimization draft",
    description: "Listing or SEO content tweak proposal for review.",
    mode,
    payload,
  });
}

export function draftBrokerLeadRoutingProposed(
  mode: ProposedAction["mode"],
  payload: Record<string, unknown>,
) {
  return createProposedAction({
    domain: "BROKER_ROUTING",
    type: "LEAD_ROUTING",
    title: "Broker lead routing recommendation",
    description: "Advisor routing suggestion — execution remains manual.",
    mode,
    payload,
  });
}

export function draftPortfolioCapitalRecommendationProposed(
  mode: ProposedAction["mode"],
  payload: Record<string, unknown>,
  expectedImpact?: ProposedAction["expectedImpact"],
) {
  const impact =
    expectedImpact ??
    (payload.expectedImpact !== undefined && typeof payload.expectedImpact === "object" && payload.expectedImpact !== null
      ? (payload.expectedImpact as ProposedAction["expectedImpact"])
      : undefined);

  return createProposedAction({
    domain: "INVESTMENT",
    type: "PORTFOLIO_CAPITAL",
    title: "Portfolio capital allocation recommendation",
    description: "Capital allocator output — approval required before any deployment.",
    mode,
    payload,
    expectedImpact: impact,
  });
}

export function draftMaintenancePrioritizationProposed(
  mode: ProposedAction["mode"],
  payload: Record<string, unknown>,
) {
  return createProposedAction({
    domain: "MAINTENANCE",
    type: "MAINTENANCE_PRIORITY",
    title: "Maintenance prioritization",
    description: "Ranked maintenance items from operational signals.",
    mode,
    payload,
  });
}
