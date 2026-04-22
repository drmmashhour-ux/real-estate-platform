import { randomUUID } from "crypto";

import type {
  GrowthActionCode,
  GrowthActionRiskTier,
  GrowthProposedActionVm,
  GrowthSignalVm,
} from "./growth-engine.types";

function riskForAction(action: GrowthActionCode): GrowthActionRiskTier {
  switch (action) {
    case "adjust_price":
      return "requires_approval";
    case "promote_listing":
      return "safe_auto";
    case "reorder_listing_rank":
      return "safe_auto";
    case "highlight_listing":
      return "safe_auto";
    case "suggest_content_improvement":
      return "requires_approval";
    case "trigger_notification":
      return "safe_auto";
    case "send_user_prompt":
      return "safe_auto";
    default:
      return "blocked";
  }
}

/**
 * Deterministic signal → candidate actions (explainable mapping).
 */
export function mapSignalsToActions(signals: GrowthSignalVm[]): GrowthProposedActionVm[] {
  const out: GrowthProposedActionVm[] = [];

  for (const s of signals) {
    switch (s.signal) {
      case "high_views_low_booking":
        out.push(
          mk(s, "promote_listing", "Eligible for internal discovery boost — high visibility, weak conversion."),
          mk(s, "adjust_price", "Pricing may be misaligned vs comps; requires human approval before any change."),
          mk(s, "trigger_notification", "Notify owner with performance summary and optional boost."),
        );
        break;
      case "inactive_listing":
        out.push(
          mk(s, "send_user_prompt", "Invite seller to refresh photos or description."),
          mk(s, "suggest_content_improvement", "Draft improvement checklist — queued for approval if configured."),
          mk(s, "trigger_notification", "Reminder nudge to inactive listing owner."),
        );
        break;
      case "high_demand_low_supply":
        out.push(
          mk(s, "reorder_listing_rank", "Boost surface rank for listings in undersupplied city (bounded)."),
          mk(s, "promote_listing", "Temporary internal promotion signal for regional balance."),
        );
        break;
      case "low_conversion":
        out.push(
          mk(s, "send_user_prompt", "Broker playbook prompt — follow-up SLA on stalled leads."),
          mk(s, "trigger_notification", "Broker ops alert on pipeline hygiene."),
        );
        break;
      case "price_misaligned":
        out.push(
          mk(s, "adjust_price", "Suggested nightly alignment — approval only."),
          mk(s, "promote_listing", "Discovery boost while pricing is reviewed."),
        );
        break;
      case "drop_off_point":
        out.push(
          mk(s, "highlight_listing", "Highlight urgency tags on browse cards (reversible styling flag)."),
          mk(s, "trigger_notification", "Guest unlock drop-off — host message with checklist."),
        );
        break;
      default:
        break;
    }
  }

  const seen = new Set<string>();
  return out.filter((a) => {
    const k = `${a.action}:${a.entityKind}:${a.entityId ?? ""}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function mk(signal: GrowthSignalVm, action: GrowthActionCode, explanation: string): GrowthProposedActionVm {
  return {
    id: randomUUID(),
    signalRefId: signal.id,
    signal: signal.signal,
    action,
    riskTier: riskForAction(action),
    explanation,
    payload: { signalContext: signal.context },
    entityKind: signal.entityKind,
    entityId: signal.entityId,
  };
}
