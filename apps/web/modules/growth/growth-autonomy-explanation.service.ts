/**
 * Deterministic operator copy — derived from autonomy mode, enforcement mode, and disposition only.
 */

import type {
  GrowthAutonomyActionType,
  GrowthAutonomyDisposition,
  GrowthAutonomyExplanation,
  GrowthAutonomyMode,
} from "./growth-autonomy.types";
import type { GrowthEnforcementMode } from "./growth-policy-enforcement.types";

export function buildAutonomyExplanation(args: {
  autonomyMode: GrowthAutonomyMode;
  disposition: GrowthAutonomyDisposition;
  enforcementMode: GrowthEnforcementMode;
  enforcementAvailable: boolean;
  snapshotPartial: boolean;
  label: string;
  whyInCatalog: string;
  actionType?: GrowthAutonomyActionType;
}): GrowthAutonomyExplanation {
  const partialNote = args.snapshotPartial ? " Enforcement inputs were partially available — treat this as directional." : "";

  if (args.disposition === "blocked") {
    return {
      whySuggested: args.whyInCatalog,
      whyBlockedOrAllowed:
        args.enforcementMode === "block"
          ? `Policy enforcement marks this target as blocked (${args.enforcementMode}).`
          : args.enforcementMode === "freeze"
            ? `Policy enforcement marks this target as frozen (${args.enforcementMode}).`
            : `Autonomy cannot surface this item under current rules.${partialNote}`,
      whatNext:
        args.enforcementMode === "block"
          ? "Review governance / policy inputs for this target; do not assume downstream promotion."
          : args.enforcementMode === "freeze"
            ? "Inspect learning and autopilot conditions that led to freeze before changing posture."
            : "Wait for enforcement snapshot or widen inputs; avoid treating outputs as cleared.",
    };
  }

  if (args.disposition === "approval_required") {
    if (args.actionType === "request_manual_review") {
      return {
        whySuggested: args.whyInCatalog,
        whyBlockedOrAllowed:
          args.enforcementAvailable && args.enforcementMode === "approval_required"
            ? "Policy marks this path as approval_required — you need an explicit sign-off before learning or automation posture changes."
            : `Manual review is required — ${args.enforcementAvailable ? "policy" : "governance without a full enforcement snapshot"} still requires a human decision.${partialNote}`,
        whatNext:
          "Open Growth Machine with review focus: use the “Open … — manual review” link (adds ?growthAutonomyFocus=review) or go to the same URL yourself. Document the decision in governance or with a platform admin before changing learning weights; do not auto-apply.",
      };
    }
    return {
      whySuggested: args.whyInCatalog,
      whyBlockedOrAllowed:
        args.enforcementAvailable && args.enforcementMode === "approval_required"
          ? "Policy enforcement requires explicit approval before treating this path as cleared."
          : `Manual review is required — ${args.enforcementAvailable ? "policy" : "autonomy without enforcement"} demands operator sign-off.${partialNote}`,
      whatNext:
        args.enforcementAvailable && args.enforcementMode === "approval_required"
          ? "Route to Growth governance / policy approval on this dashboard first, then capture the outcome before promotion or spend."
          : "Escalate to an admin or governance owner; capture written approval before any downstream promotion.",
    };
  }

  if (args.disposition === "hidden") {
    return {
      whySuggested: args.whyInCatalog,
      whyBlockedOrAllowed:
        args.autonomyMode === "OFF"
          ? "Autonomy mode is OFF — suggestions stay hidden outside internal/debug surfaces."
          : `This item is not shown in the current rollout or mode.${partialNote}`,
      whatNext:
        args.autonomyMode === "OFF"
          ? "Set FEATURE_GROWTH_AUTONOMY_MODE to ASSIST or SAFE_AUTOPILOT when ready (with governance buy-in)."
          : "Adjust rollout stage or autonomy mode after review.",
    };
  }

  if (args.disposition === "prefilled_action") {
    return {
      whySuggested: args.whyInCatalog,
      whyBlockedOrAllowed:
        args.enforcementMode === "allow" || args.enforcementMode === "advisory_only"
          ? `Safe autopilot may prefill navigation/copy only — enforcement mode is ${args.enforcementMode}. No automatic writes or sends.${partialNote}`
          : `Prefill is constrained because enforcement mode is ${args.enforcementMode}.${partialNote}`,
      whatNext: "Use the prefilled link or copy, then apply changes manually in the target panel.",
    };
  }

  // suggest_only
  return {
    whySuggested: args.whyInCatalog,
    whyBlockedOrAllowed: args.enforcementAvailable
      ? `Shown as advisory — enforcement mode is ${args.enforcementMode}. No automatic execution.${partialNote}`
      : `Enforcement layer is off or unavailable — suggestions are heuristic only until policy enforcement is enabled.${partialNote}`,
    whatNext:
      args.enforcementMode === "advisory_only"
        ? "You may apply suggestions manually in the relevant growth panel."
        : "Review the linked surface and confirm before any downstream step.",
  };
}
