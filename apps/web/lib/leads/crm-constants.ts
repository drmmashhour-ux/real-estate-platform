/**
 * Broker CRM — normalized lead types & pipeline statuses.
 */

export const CRM_LEAD_TYPES = [
  "evaluation_lead",
  "fsbo_lead",
  "booking_lead",
  "broker_consultation",
  "mortgage_lead",
] as const;
export type CrmLeadType = (typeof CRM_LEAD_TYPES)[number];

export const CRM_PIPELINE_STATUSES = [
  "new",
  "contacted",
  "qualified",
  "follow_up",
  "meeting",
  "negotiation",
  "won",
  "lost",
] as const;
export type CrmPipelineStatus = (typeof CRM_PIPELINE_STATUSES)[number];

/** Map raw Prisma leadSource → CRM lead type for display/filter. */
export function normalizeCrmLeadType(leadSource: string | null | undefined): CrmLeadType {
  const s = (leadSource ?? "").toLowerCase().trim();
  if (s === "evaluation_lead") return "evaluation_lead";
  if (s.startsWith("fsbo") || s.includes("fsbo")) return "fsbo_lead";
  if (
    s.includes("booking") ||
    s.includes("bnhub") ||
    s.includes("reservation") ||
    s.includes("stay")
  ) {
    return "booking_lead";
  }
  if (s === "broker_consultation") return "broker_consultation";
  if (s === "mortgage_inquiry" || s.includes("mortgage")) return "mortgage_lead";
  return "broker_consultation";
}
