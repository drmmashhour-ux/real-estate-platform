/** Maps legal deal.status + optional crmStage to broker reminders (rule-based). */

export function suggestDealActions(deal: { status: string; crmStage?: string | null }): string[] {
  const s = deal.status.toLowerCase();
  const crm = deal.crmStage?.toLowerCase() ?? "";
  const out: string[] = [];

  if (crm === "visit_scheduled" || s === "initiated") {
    out.push("Confirm visit time with buyer + seller; send calendar hold.");
  }
  if (crm === "offer_made" || s === "offer_submitted") {
    out.push("Track offer deadline; prepare counter-offer checklist (broker-led).");
  }
  if (s === "inspection" || s === "financing") {
    out.push("Remind parties of condition dates; AI does not interpret clauses.");
  }
  if (s === "closing_scheduled") {
    out.push("Closing date approaching — verify notaire / lawyer appointment and funds.");
  }
  if (s === "closed") {
    out.push("Move client to retention cadence; mark lead closed if linked.");
  }
  if (s === "cancelled") {
    out.push("Log reason lost; optional re-engagement in 90 days (human decision).");
  }
  if (out.length === 0) {
    out.push("Update CRM stage to reflect reality; keep milestones in sync.");
  }
  return [...new Set(out)];
}

/** Suggested CRM stage when deal.status changes (hint only). */
export function hintCrmStageFromDealStatus(status: string): string | null {
  switch (status.toLowerCase()) {
    case "initiated":
      return "contacted";
    case "offer_submitted":
      return "offer_made";
    case "accepted":
      return "accepted";
    case "inspection":
    case "financing":
      return "negotiation";
    case "closing_scheduled":
      return "negotiation";
    case "closed":
      return "closed";
    case "cancelled":
      return "lost";
    default:
      return null;
  }
}
