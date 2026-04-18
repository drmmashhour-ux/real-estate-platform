/**
 * Advisory-only gating wrappers — returns metadata; does not mutate source payloads.
 */

import type { GrowthPolicyEnforcementSnapshot } from "./growth-policy-enforcement.types";
import { getEnforcementForTarget } from "./growth-policy-enforcement-query.service";

export type AutopilotUiGate = {
  hideAdvisoryConversionAffordances: boolean;
  disableSafeExecutionButton: boolean;
  badge?: string;
  notes: string[];
};

export function applyPolicyToAutopilotUi(snapshot: GrowthPolicyEnforcementSnapshot | null): AutopilotUiGate {
  if (!snapshot) {
    return { hideAdvisoryConversionAffordances: false, disableSafeExecutionButton: false, notes: [] };
  }
  const adv = getEnforcementForTarget("autopilot_advisory_conversion", snapshot);
  const safe = getEnforcementForTarget("autopilot_safe_execution", snapshot);
  const hideAdv = adv.mode !== "allow";
  const disableSafe =
    safe.mode === "block" || safe.mode === "freeze" || safe.mode === "approval_required";
  let badge: string | undefined;
  if (safe.mode === "freeze" || adv.mode === "freeze") badge = "Frozen by policy";
  else if (safe.mode === "block" || adv.mode === "block") badge = "Blocked by policy";
  else if (safe.mode === "approval_required") badge = "Approval required";
  else if (adv.mode === "advisory_only") badge = "Advisory only";

  return {
    hideAdvisoryConversionAffordances: hideAdv,
    disableSafeExecutionButton: disableSafe,
    badge,
    notes: [adv.rationale, safe.rationale].filter(Boolean).slice(0, 2),
  };
}

export type LearningGate = {
  allowWeightAdjustments: boolean;
  note?: string;
};

export function applyPolicyToLearning(snapshot: GrowthPolicyEnforcementSnapshot | null): LearningGate {
  if (!snapshot) return { allowWeightAdjustments: true };
  const d = getEnforcementForTarget("learning_adjustments", snapshot);
  const allow = d.mode !== "freeze" && d.mode !== "block";
  return {
    allowWeightAdjustments: allow,
    note: allow ? undefined : `Learning adjustments gated: ${d.mode}`,
  };
}

export type FusionBridgeGate = {
  suppressBridgePromotion: boolean;
  notes: string[];
};

const FUSION_BRIDGE_TARGETS = [
  "fusion_autopilot_bridge",
  "fusion_content_bridge",
  "fusion_influence_bridge",
] as const;

export function applyPolicyToFusionBridges(snapshot: GrowthPolicyEnforcementSnapshot | null): FusionBridgeGate {
  if (!snapshot) return { suppressBridgePromotion: false, notes: [] };
  const notes: string[] = [];
  let suppress = false;
  for (const t of FUSION_BRIDGE_TARGETS) {
    const d = getEnforcementForTarget(t, snapshot);
    if (d.mode === "block" || d.mode === "freeze" || d.mode === "advisory_only") {
      suppress = true;
      notes.push(d.rationale);
    }
  }
  return {
    suppressBridgePromotion: suppress,
    notes: notes.slice(0, 3),
  };
}

export type ContentAssistGate = {
  suppressRegenerateTriggers: boolean;
  readOnlyNotice?: string;
};

export function applyPolicyToContentAssist(snapshot: GrowthPolicyEnforcementSnapshot | null): ContentAssistGate {
  if (!snapshot) return { suppressRegenerateTriggers: false };
  const d = getEnforcementForTarget("content_assist_generation", snapshot);
  const suppress = d.mode === "block" || d.mode === "freeze";
  return {
    suppressRegenerateTriggers: suppress,
    readOnlyNotice: suppress ? "Draft regeneration suppressed by policy enforcement." : undefined,
  };
}

export type MissionControlPromotionGate = {
  suppressPromotion: boolean;
  note?: string;
};

export type MessagingAssistGate = {
  suppressRegenerateTriggers: boolean;
  blockOutboundPromotion: boolean;
  notice?: string;
};

export function applyPolicyToMessagingAssist(snapshot: GrowthPolicyEnforcementSnapshot | null): MessagingAssistGate {
  if (!snapshot) {
    return { suppressRegenerateTriggers: false, blockOutboundPromotion: false };
  }
  const d = getEnforcementForTarget("messaging_assist_generation", snapshot);
  const suppress = d.mode === "block" || d.mode === "freeze";
  const blockOutboundPromotion =
    d.mode === "advisory_only" ||
    d.mode === "approval_required" ||
    d.mode === "block" ||
    d.mode === "freeze";
  return {
    suppressRegenerateTriggers: suppress,
    blockOutboundPromotion,
    notice:
      blockOutboundPromotion && !suppress
        ? "Messaging assist is draft-only — outbound send paths stay gated."
        : suppress
          ? "Messaging draft regeneration suppressed by policy enforcement."
          : undefined,
  };
}

export function applyPolicyToMissionControlPromotion(snapshot: GrowthPolicyEnforcementSnapshot | null): MissionControlPromotionGate {
  if (!snapshot) return { suppressPromotion: false };
  const sim = getEnforcementForTarget("simulation_recommendation_promotion", snapshot);
  const strat = getEnforcementForTarget("strategy_recommendation_promotion", snapshot);
  const suppress = sim.mode !== "allow" || strat.mode !== "allow";
  return {
    suppressPromotion: suppress,
    note: suppress ? "Recommendation promotion suppressed under current enforcement." : undefined,
  };
}
