import type { AiDisputePreventionAction, AiDisputeRiskLevel } from "@prisma/client";

/** Maps risk level to platform-neutral prevention channel (no adjudication). */
export function preventionActionForLevel(level: AiDisputeRiskLevel): AiDisputePreventionAction {
  switch (level) {
    case "LOW":
      return "GENTLE_REMINDER";
    case "MEDIUM":
      return "NOTIFY_BOTH_PARTIES";
    case "HIGH":
      return "NOTIFY_ADMIN_ESCALATION";
    default:
      return "NOTIFY_BOTH_PARTIES";
  }
}
