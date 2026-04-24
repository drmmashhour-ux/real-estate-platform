import type { LecipmExecutionRiskLevel, LecipmExecutionTaskType } from "@prisma/client";

/**
 * Default risk tier per task kind — medium/high always pass through approval gates before side effects.
 */
export function classifyExecutionRisk(taskType: LecipmExecutionTaskType): LecipmExecutionRiskLevel {
  switch (taskType) {
    case "MESSAGE":
    case "FOLLOW_UP":
    case "NOTARY_REMINDER":
    case "INVOICE_PREP":
      return "LOW";
    case "DOCUMENT_PREP":
    case "DEAL_STAGE_PREP":
      return "LOW";
    case "PRICE_UPDATE_PREP":
    case "INVESTOR_PACKET_PREP":
    case "DISCLOSURE_PREP":
    case "OFFER_PREP":
      return "MEDIUM";
    default:
      return "MEDIUM";
  }
}
