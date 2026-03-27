/** Valid values for Lead.pipelineStatus (automation + CRM). */
export const LEAD_PIPELINE = {
  NEW: "new",
  CONTACTED: "contacted",
  AWAITING_REPLY: "awaiting_reply",
  QUALIFIED: "qualified",
  BROKER_ASSIGNED: "broker_assigned",
  CLOSED: "closed",
  LOST: "lost",
} as const;

export type LeadPipelineStatus = (typeof LEAD_PIPELINE)[keyof typeof LEAD_PIPELINE];

export function isWarmOrHotTier(tier: string | null | undefined, score: number, hotThreshold: number): boolean {
  const t = (tier ?? "").toLowerCase();
  if (t === "hot" || t === "warm") return true;
  return score >= hotThreshold - 15;
}
