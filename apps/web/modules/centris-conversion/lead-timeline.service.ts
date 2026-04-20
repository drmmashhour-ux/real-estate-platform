import { prisma } from "@/lib/db";

import { logLead } from "./centris-funnel.log";

export type LeadFunnelEventType = "VIEW" | "CONTACT" | "SAVE" | "BOOKING";

/** Maps to `LeadTimelineEvent.eventType` — CRM timeline + Centris funnel analytics. */
export async function recordLeadFunnelEvent(
  leadId: string,
  type: LeadFunnelEventType,
  metadata?: Record<string, unknown>,
): Promise<void> {
  try {
    await prisma.leadTimelineEvent.create({
      data: {
        leadId,
        eventType: `FUNNEL_${type}`,
        payload: {
          ...(metadata ?? {}),
          channel: metadata?.channel ?? "LECIPM",
        },
      },
    });
    logLead("timeline_event", { leadId, type });
  } catch (e) {
    logLead("timeline_event_failed", {
      leadId,
      type,
      err: e instanceof Error ? e.message : "unknown",
    });
  }
}
