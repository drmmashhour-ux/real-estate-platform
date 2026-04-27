import type { AutonomousAction } from "./executor";

/**
 * Maps policy to executor actions. `compliance_block` maps to system `compliance_block` with a clear message.
 */
export function buildRiskActions(decision: string): AutonomousAction[] {
  if (decision === "block") {
    return [
      {
        type: "compliance_block",
        message: "fraud_risk: automated trust policy (block)",
      },
    ];
  }
  if (decision === "review") {
    return [{ type: "manual_review_flag", reason: "trust_policy_review" }];
  }
  return [];
}
