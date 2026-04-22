/** Senior Hub autonomous marketplace layer — human-supervised only. */

export type AutonomyModeId = "OFF" | "ASSIST" | "SAFE_AUTOPILOT" | "FULL_AUTOPILOT_APPROVAL";

export const AUTONOMOUS_ACTION_TYPES = [
  "BOOST_OPERATOR",
  "REDUCE_OPERATOR_VISIBILITY",
  "REASSIGN_LEAD",
  "INCREASE_PRICE",
  "DECREASE_PRICE",
  "PRIORITIZE_LEAD",
  "TRIGGER_FOLLOWUP",
  "SUGGEST_EXPANSION",
  "FLAG_RISK",
] as const;

export type AutonomousActionType = (typeof AUTONOMOUS_ACTION_TYPES)[number];

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export type AutonomousActionProposal = {
  actionType: AutonomousActionType;
  payload: Record<string, unknown>;
  reason: string;
  confidence: number;
  riskLevel: RiskLevel;
  impactConversionPct: number | null;
  impactRevenuePct: number | null;
};

/** Maps action kind → baseline risk (engine may override). */
export function defaultRiskForAction(type: AutonomousActionType): RiskLevel {
  switch (type) {
    case "PRIORITIZE_LEAD":
    case "TRIGGER_FOLLOWUP":
      return "LOW";
    case "BOOST_OPERATOR":
    case "REDUCE_OPERATOR_VISIBILITY":
    case "REASSIGN_LEAD":
      return "MEDIUM";
    case "INCREASE_PRICE":
    case "DECREASE_PRICE":
    case "SUGGEST_EXPANSION":
    case "FLAG_RISK":
      return "HIGH";
    default:
      return "MEDIUM";
  }
}
