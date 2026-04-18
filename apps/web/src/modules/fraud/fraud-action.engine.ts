import { fraudTrustV1Flags } from "@/config/feature-flags";
import type { FraudScoreComputation } from "@/src/modules/fraud/types";

export type FraudTrustAction = "flag_listing" | "reduce_visibility" | "require_verification" | "block_action" | "queue_for_review";

/**
 * Maps risk tiers to operational actions — **admin/policy gated**; no automatic public accusations.
 * Persistence is handled by `evaluateFraudRisk` + `flaggingEngine` — this is the playbook only.
 */
export function planActionsForFraudScore(result: FraudScoreComputation): {
  actions: FraudTrustAction[];
  notes: string[];
} {
  const notes: string[] = [];
  const actions: FraudTrustAction[] = [];

  if (!fraudTrustV1Flags.fraudDetectionV1) {
    return { actions: [], notes: ["FEATURE_FRAUD_DETECTION_V1 off — no automated action plan"] };
  }

  actions.push("flag_listing");
  notes.push("Internal flags via fraud pipeline for material signals (see fraud_flags).");

  if (result.riskLevel === "medium" || result.riskLevel === "high" || result.riskLevel === "critical") {
    actions.push("reduce_visibility");
    notes.push("Soft ranking penalty path when FEATURE_RISK_SCORING_V1 + env allow.");
  }

  if (result.riskLevel === "high" || result.riskLevel === "critical") {
    actions.push("queue_for_review");
    actions.push("require_verification");
    notes.push("Queue admin review and step-up verification — human decision for sanctions.");
  }

  if (result.riskLevel === "critical") {
    actions.push("block_action");
    notes.push("Critical tier — hard blocks require explicit admin policy (no auto public messaging).");
  }

  return { actions, notes };
}
