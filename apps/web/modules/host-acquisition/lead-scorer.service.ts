import { MONTREAL_HOST_ACQUISITION_ZONES } from "./montreal-zones.constants";

export type LeadScoreInput = {
  city?: string | null;
  market?: string | null;
  source?: string | null;
  hasContact?: boolean;
};

/** Deterministic 0–100 score for prioritization — not a conversion prediction. */
export function scoreHostAcquisitionLead(input: LeadScoreInput): { score: number; reasons: string[] } {
  let score = 40;
  const reasons: string[] = [];

  const zone = (input.market ?? input.city ?? "").toLowerCase();
  const inZone = MONTREAL_HOST_ACQUISITION_ZONES.some((z) => zone.includes(z.split("-")[0]?.toLowerCase() ?? "") || zone.includes(z.toLowerCase()));
  if (inZone) {
    score += 25;
    reasons.push("Inside Montreal priority band (config list).");
  }

  if (input.hasContact) {
    score += 15;
    reasons.push("Contact channel present.");
  }

  if (input.source && /instagram|airbnb|referral|web/i.test(input.source)) {
    score += 10;
    reasons.push("Source indicates inbound or identifiable listing.");
  }

  return { score: Math.min(100, score), reasons };
}
