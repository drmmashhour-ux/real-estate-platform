/**
 * Deterministic action proposals from opportunities + policy — no execution.
 */

import type {
  MarketplaceActionProposal,
  MarketplaceActionType,
  MarketplaceOpportunity,
  MarketplaceOpportunityType,
  MarketplacePolicyEvaluation,
  MarketplaceRiskLevel,
} from "./darlink-marketplace-autonomy.types";
import type { ResolveMarketplaceGovernanceResult } from "./darlink-autonomy-governance.service";

const MAX_PROPOSALS = 100;

function riskForAction(a: MarketplaceActionType): MarketplaceRiskLevel {
  if (a === "ADD_INTERNAL_NOTE" || a === "CREATE_INTERNAL_TASK") return "low";
  if (a === "FLAG_LISTING_REVIEW" || a === "RECORD_CHECKIN") return "medium";
  return "high";
}

function mapOpportunityToActions(t: MarketplaceOpportunityType): MarketplaceActionType[] {
  switch (t) {
    case "review_pricing":
      return ["ADD_INTERNAL_NOTE", "CREATE_INTERNAL_TASK"];
    case "improve_listing_content":
      return ["CREATE_INTERNAL_TASK"];
    case "request_admin_review":
      return ["FLAG_LISTING_REVIEW", "CREATE_INTERNAL_TASK"];
    case "increase_visibility":
      return ["ADD_INTERNAL_NOTE"];
    case "reduce_risk":
      return ["CREATE_INTERNAL_TASK", "FLAG_LISTING_REVIEW"];
    case "review_booking_friction":
      return ["CREATE_INTERNAL_TASK"];
    case "review_payout_state":
      return ["CREATE_INTERNAL_TASK"];
    case "promote_high_trust_listing":
      return ["ADD_INTERNAL_NOTE"];
    case "refresh_stale_listing":
      return ["CREATE_INTERNAL_TASK"];
    case "prioritize_high_intent_leads":
      return ["CREATE_INTERNAL_TASK"];
    default:
      return ["CREATE_INTERNAL_TASK"];
  }
}

export function buildMarketplaceActionProposals(
  opportunities: MarketplaceOpportunity[],
  policy: MarketplacePolicyEvaluation,
  _governance: ResolveMarketplaceGovernanceResult,
): MarketplaceActionProposal[] {
  try {
    const out: MarketplaceActionProposal[] = [];
    for (const o of opportunities) {
      const po = policy.opportunityOutcomes[o.id];
      if (!po || po.outcome === "blocked") continue;

      const actions = mapOpportunityToActions(o.type);
      let i = 0;
      for (const actionType of actions) {
        if (out.length >= MAX_PROPOSALS) break;
        const id = `prop:${o.id}:${actionType}:${i}`;
        const rk = riskForAction(actionType);
        const reasons = [...po.reasons];
        if (po.outcome === "approval_required") {
          reasons.push("opportunity_lane_requires_approval");
        }
        out.push({
          id,
          actionType,
          entityType: o.entityType,
          entityId: o.entityId,
          opportunityId: o.id,
          riskLevel: rk,
          reasons,
          payload: {
            opportunityType: o.type,
            opportunityTitle: o.title,
            policyOutcome: po.outcome,
          },
        });
        i += 1;
      }
    }
    return out.sort((a, b) => a.id.localeCompare(b.id));
  } catch {
    return [];
  }
}
