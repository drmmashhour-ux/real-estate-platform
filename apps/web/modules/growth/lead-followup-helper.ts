/**
 * Lightweight follow-up queue for early conversion leads (manual ops).
 * No automation — filter helpers only.
 */

export type EarlyLeadPayloadMeta = {
  priorityLevel?: "high" | "normal";
  /** Set via admin mark-handled when a lead has been addressed. */
  handled?: boolean;
  /** Paid traffic attribution from /get-leads (optional). */
  utm_source?: string;
  utm_campaign?: string;
  utm_medium?: string;
};

export type EarlyLeadFollowUpInput = {
  createdAt: Date;
  payloadJson: unknown;
};

function getMetadata(payloadJson: unknown): EarlyLeadPayloadMeta {
  if (!payloadJson || typeof payloadJson !== "object") return {};
  const p = payloadJson as Record<string, unknown>;
  const m = p.metadata;
  if (!m || typeof m !== "object") return {};
  return m as EarlyLeadPayloadMeta;
}

/** Leads older than 24h that are not marked handled (metadata.handled !== true). */
export function getLeadsNeedingFollowUp<T extends EarlyLeadFollowUpInput>(leads: T[]): T[] {
  const cutoffMs = Date.now() - 24 * 60 * 60 * 1000;
  return leads.filter((l) => {
    if (l.createdAt.getTime() > cutoffMs) return false;
    const meta = getMetadata(l.payloadJson);
    if (meta.handled === true) return false;
    return true;
  });
}
