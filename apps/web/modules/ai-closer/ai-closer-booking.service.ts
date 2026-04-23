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
