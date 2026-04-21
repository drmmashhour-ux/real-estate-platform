/** Product positioning — dashboard / marketing */
export const DEAL_LIFECYCLE_POSITIONING =
  "From first message to closing — fully optimized by AI.";

/**
 * Canonical deal lifecycle for LECIPM dashboards.
 * Mapped from `Lead.lecipmCrmStage` / `Lead.pipelineStage` plus `Deal.status` when linked.
 */
export type LifecycleStage =
  | "NEW_LEAD"
  | "CONTACTED"
  | "QUALIFIED"
  | "VISIT_SCHEDULED"
  | "OFFER_SENT"
  | "NEGOTIATION"
  | "CLOSED";

export const LIFECYCLE_ORDER: LifecycleStage[] = [
  "NEW_LEAD",
  "CONTACTED",
  "QUALIFIED",
  "VISIT_SCHEDULED",
  "OFFER_SENT",
  "NEGOTIATION",
  "CLOSED",
];

export const STAGE_LABEL: Record<LifecycleStage, string> = {
  NEW_LEAD: "New lead",
  CONTACTED: "Contacted",
  QUALIFIED: "Qualified",
  VISIT_SCHEDULED: "Visit scheduled",
  OFFER_SENT: "Offer sent",
  NEGOTIATION: "Negotiation",
  CLOSED: "Closed",
};

/** Normalize legacy CRM strings onto canonical stages */
export function canonicalStageFromLead(row: {
  lecipmCrmStage: string | null;
  pipelineStage: string;
  pipelineStatus: string;
  wonAt?: Date | null;
  lostAt?: Date | null;
}): LifecycleStage {
  const raw = (row.lecipmCrmStage ?? row.pipelineStage ?? "new").toLowerCase().trim();
  if (row.wonAt || row.pipelineStatus.toLowerCase() === "won") return "CLOSED";
  if (row.lostAt || row.pipelineStatus.toLowerCase() === "lost") return "CLOSED";

  if (raw.includes("closed") || raw === "won" || raw === "lost") return "CLOSED";
  if (raw.includes("negotiation") || (raw.includes("offer") && raw.includes("counter")))
    return "NEGOTIATION";
  if (raw.includes("offer") || raw.includes("promise")) return "OFFER_SENT";
  if (raw.includes("visit") || raw.includes("meeting") || raw.includes("showing")) return "VISIT_SCHEDULED";
  if (raw.includes("qualified") || raw === "qualified") return "QUALIFIED";
  if (raw.includes("contact")) return "CONTACTED";
  if (raw.includes("new")) return "NEW_LEAD";

  return "NEW_LEAD";
}

export function lifecycleStageToLeadCrmStage(stage: LifecycleStage): string {
  const map: Record<LifecycleStage, string> = {
    NEW_LEAD: "new_lead",
    CONTACTED: "contacted",
    QUALIFIED: "qualified",
    VISIT_SCHEDULED: "visit_scheduled",
    OFFER_SENT: "offer_made",
    NEGOTIATION: "negotiation",
    CLOSED: "closed",
  };
  return map[stage];
}
