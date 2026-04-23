import { prisma } from "@/lib/db";

import { recordAiSalesEvent } from "./ai-sales-log.service";
import type { AiSalesMode } from "./ai-sales.types";

/** Proposes business-hours-friendly slots (assistant proposes; broker confirms). */
export function proposeBusinessHourSlots(timezoneLabel = "local ET", count = 4): string[] {
  const out: string[] = [];
  const base = new Date();
  for (let d = 1; d <= 5 && out.length < count; d++) {
    const day = new Date(base);
    day.setDate(day.getDate() + d);
    if (day.getDay() === 0 || day.getDay() === 6) continue;
    const iso = day.toISOString().slice(0, 10);
    out.push(`${iso} · 12:00–13:00 ${timezoneLabel}`);
    out.push(`${iso} · 17:30–18:30 ${timezoneLabel}`);
  }
  return out.slice(0, count);
}

export async function confirmVisitRequest(params: {
  leadId: string;
  preferredSlotLabel: string;
  notes?: string;
  mode: AiSalesMode;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const lead = await prisma.lead.findUnique({
    where: { id: params.leadId },
    select: { id: true, aiExplanation: true },
  });
  if (!lead) return { ok: false, error: "Lead not found" };

  const prev = (lead.aiExplanation as Record<string, unknown> | null) ?? {};
  await prisma.lead.update({
    where: { id: params.leadId },
    data: {
      lecipmCrmStage: "visit_scheduled",
      aiExplanation: {
        ...prev,
        aiSalesBooking: {
          preferredSlotLabel: params.preferredSlotLabel,
          notes: params.notes ?? null,
          recordedAt: new Date().toISOString(),
        },
      },
    },
  });

  await recordAiSalesEvent(params.leadId, "AI_SALES_BOOKING_CONFIRMED", {
    assistant: "lecipm",
    mode: params.mode,
    explain: "visit_request_recorded",
    metadata: {
      preferredSlotLabel: params.preferredSlotLabel,
      notes: params.notes ?? null,
    },
  });

  return { ok: true };
}

export async function recordBookingProposal(params: {
  leadId: string;
  slots: string[];
  mode: AiSalesMode;
}): Promise<void> {
  await recordAiSalesEvent(params.leadId, "AI_SALES_BOOKING_PROPOSED", {
    assistant: "lecipm",
    mode: params.mode,
    explain: "slots_proposed_to_lead",
    metadata: { slots: params.slots },
  });
}
