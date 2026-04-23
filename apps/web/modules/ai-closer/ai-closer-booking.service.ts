import { getBestAvailableBroker } from "../centris-conversion/centris-broker-routing.service";
import { getAvailableSlots, defaultSearchRange } from "../booking-system/broker-availability.service";
import { groupSlotsForUi, formatSlotListForMessage } from "../booking-system/booking-calendar.service";

import type { AiCloserRouteContext, AiCloserStage } from "./ai-closer.types";

export function generateBookingPrompt(input: {
  stage: AiCloserStage;
  route: AiCloserRouteContext;
  preferredChannel?: "email" | "sms" | "chat";
}): string {
  const ch = input.preferredChannel ?? "email";
  const routeNote =
    input.route === "centris"
      ? "Centris-attributed listing — broker confirms showing."
      : input.route === "investor"
        ? "Investor flow — coordinator confirms slot."
        : "Broker confirms availability on-platform.";

  if (input.stage === "READY_TO_BOOK") {
    return `LECIPM assistant: propose two concrete slots (weekday lunch / Sat AM). Channel: ${ch}. ${routeNote}`;
  }
  return `LECIPM assistant: soft-book — ask week A vs week B before proposing times. ${routeNote}`;
}

export type VisitIntentResult = { ready: boolean; notes: string };

/** Marks CRM intent flags via caller — returns structured recommendation only (no DB here). */
export function evaluateVisitIntent(stage: AiCloserStage, lastMessage: string): VisitIntentResult {
  const t = lastMessage.toLowerCase();
  const urgent = /\b(asap|soon|today|tomorrow|this week)\b/i.test(t);
  if (stage === "READY_TO_BOOK" || /\b(book|visit|showing|voir)\b/i.test(t)) {
    return {
      ready: true,
      notes: urgent ? "High urgency language — prioritize two-slot proposal." : "Visit intent detected.",
    };
  }
  return { ready: false, notes: "Keep discovery / objection handling first." };
}

/**
 * Loads real open visit slots for the listing broker (CRM listing required).
 * User-facing copy must identify automation as the LECIPM assistant.
 */
export async function fetchAvailableSlotsForLead(input: { leadId: string; listingId: string }): Promise<{
  brokerId: string | null;
  lines: string[];
  message: string;
  availabilityNote: string;
} | null> {
  const best = await getBestAvailableBroker({ leadId: input.leadId, listingId: input.listingId });
  if (!best.bestBrokerId) {
    return {
      brokerId: null,
      lines: [],
      message: "A broker will propose times manually — no open automated slots in the next two weeks.",
      availabilityNote: best.routingReason,
    };
  }
  const { from, to } = defaultSearchRange();
  const raw = await getAvailableSlots(best.bestBrokerId, { from, to });
  const ui = groupSlotsForUi(raw);
  const block = formatSlotListForMessage(ui);
  return {
    brokerId: best.bestBrokerId,
    lines: ui.map((s) => `${s.relativeLabel} ${s.timeLabel}`),
    message: `I can help you schedule a visit. Here are a few available times (LECIPM assistant — not the broker):

${block}

Reply with the option that works best, or say “other times”.`,
    availabilityNote: best.routingReason,
  };
}

export function prepareBrokerHandoffSummary(input: {
  leadName?: string;
  listingTitle?: string;
  slotsSuggested?: string[];
  contactPreference?: string;
}): string {
  const lines = [
    "LECIPM assistant handoff summary (for broker)",
    input.leadName ? `Lead: ${input.leadName}` : null,
    input.listingTitle ? `Listing: ${input.listingTitle}` : null,
    input.slotsSuggested?.length ? `Suggested slots: ${input.slotsSuggested.join("; ")}` : null,
    input.contactPreference ? `Contact preference: ${input.contactPreference}` : null,
    "Broker to confirm showing and compliance.",
  ].filter(Boolean);
  return lines.join("\n");
}

/**
 * Upcoming LECIPM visit no-show *support* context (not a medical/legal prediction).
 */
export async function fetchNoShowContextForLead(leadId: string): Promise<{
  hasHighRisk: boolean;
  nudge: string;
  visitId: string | null;
  riskBand: "LOW" | "MEDIUM" | "HIGH" | "UNSET";
} | null> {
  const { prisma } = await import("@/lib/db");
  const v = await prisma.lecipmVisit.findFirst({
    where: { leadId, status: "scheduled", startDateTime: { gte: new Date() } },
    orderBy: { startDateTime: "asc" },
  });
  if (!v) return null;
  const band = (v.noShowRiskBand ?? "UNSET") as "LOW" | "MEDIUM" | "HIGH" | "UNSET";
  if (v.noShowRiskBand === "HIGH" && !v.reconfirmedAt) {
    return {
      hasHighRisk: true,
      visitId: v.id,
      riskBand: band,
      nudge:
        "This visit has a higher *likelihood* of being missed (operational score only—never guaranteed). Suggest a quick reconfirm and a gentle reschedule offer.",
    };
  }
  if (v.noShowRiskBand === "MEDIUM" && !v.reconfirmedAt) {
    return {
      hasHighRisk: false,
      visitId: v.id,
      riskBand: band,
      nudge: "A short, friendly one-line confirmation is enough before the visit.",
    };
  }
  return { hasHighRisk: false, visitId: v.id, riskBand: band, nudge: "" };
}
