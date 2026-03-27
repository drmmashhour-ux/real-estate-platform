/** LECIPM elite CRM — pipeline + scoring (broker-facing). */

export const CRM_ELITE_STAGES = [
  "new_lead",
  "contacted",
  "qualified",
  "visit_scheduled",
  "offer_made",
  "closed",
] as const;

export type CrmEliteStage = (typeof CRM_ELITE_STAGES)[number];

export function isCrmEliteStage(s: string): s is CrmEliteStage {
  return (CRM_ELITE_STAGES as readonly string[]).includes(s);
}

export type LecipmScoreBreakdown = {
  leadScore: number;
  dealQualityScore: number;
  trustScore: number;
  urgencyScore: number;
};
