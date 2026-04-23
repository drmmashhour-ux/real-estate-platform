import { prisma } from "@/lib/db";

import type { AiSalesTimelinePayload } from "./ai-sales.types";

/** Distinct timeline types for audit / explainability (does not duplicate CRM assignment). */
export type AiSalesEventType =
  | "AI_SALES_TRIGGERED"
  | "AI_SALES_MESSAGE_PLANNED"
  | "AI_SALES_MESSAGE_SENT"
  | "AI_SALES_QUALIFICATION"
  | "AI_SALES_ESCALATION"
  | "AI_SALES_BOOKING_PROPOSED"
  | "AI_SALES_BOOKING_CONFIRMED"
  | "AI_SALES_SEQUENCE_SCHEDULED"
  | "AI_SALES_SEQUENCE_STOPPED"
  | "AI_SALES_LEARNING_UPDATE"
  | "AI_SALES_INBOUND";

export async function recordAiSalesEvent(
  leadId: string,
  eventType: AiSalesEventType,
  payload: AiSalesTimelinePayload & Record<string, unknown>,
): Promise<void> {
  try {
    await prisma.leadTimelineEvent.create({
      data: {
        leadId,
        eventType,
        payload: {
          ...payload,
          source: "ai_sales_agent",
          loggedAt: new Date().toISOString(),
        },
      },
    });
  } catch {
    // Non-fatal — lead may be deleted in tests
  }
}
