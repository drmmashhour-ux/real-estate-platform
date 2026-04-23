import { prisma } from "@/lib/db";

const PREFIX = "LECIPM_NSHOW";

export type LecipmNoShowEventType =
  | "REMINDER_SENT"
  | "CONFIRMATION_RECEIVED"
  | "RISK_RECALC"
  | "RESCHEDULE_REQUESTED"
  | "RESCHEDULED"
  | "MARKED_MISSED"
  | "SLOT_CONFLICT"
  | "UNCONFIRMED_THRESHOLD";

/**
 * Auditable, reversible-friendly timeline (no PII in event type; payload carries ids).
 */
export async function recordLecipmNoShowEvent(
  leadId: string,
  event: LecipmNoShowEventType,
  payload: Record<string, unknown>,
): Promise<void> {
  try {
    await prisma.leadTimelineEvent.create({
      data: {
        leadId,
        eventType: `${PREFIX}_${event}`,
        payload: { ...payload, at: new Date().toISOString() },
      },
    });
  } catch {
    // best-effort
  }
}
