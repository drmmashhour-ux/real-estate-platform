/**
 * Rule-based CRM score (0–100) for funnel prioritization.
 * Complements legacy form/behavior merge; evaluation flow uses this as primary score.
 */

export type CrmScoreBand = "hot" | "warm" | "cold";

export type CrmScoringInput = {
  city: string;
  /** Main headline estimate */
  estimatedValue: number;
  surfaceSqft: number;
  /** Lowercased message / notes */
  message?: string | null;
  /** Engagement flags (from timeline / client events) */
  clickedConsultationCta?: boolean;
  /** Legacy combined flag — if only this is set, applies +15 once */
  clickedCallOrWhatsapp?: boolean;
  clickedCall?: boolean;
  clickedWhatsapp?: boolean;
  /** True when visitor returned to evaluation result more than once */
  repeatResultViews?: boolean;
};

export type CrmScoringResult = {
  score: number;
  band: CrmScoreBand;
  breakdown: { rule: string; points: number }[];
};

const MTL_LIKE = /montreal|montréal|laval/i;

function messageRequestsConsultation(message: string): boolean {
  return /consult|book|appointment|call me|speak|rencontre|rendez-vous/i.test(message);
}

/**
 * Points are additive then capped at 100.
 * Bands: 80+ HOT, 50–79 WARM, 0–49 COLD
 */
export function computeCrmLeadScore(input: CrmScoringInput): CrmScoringResult {
  const breakdown: { rule: string; points: number }[] = [];
  let points = 0;

  if (MTL_LIKE.test(input.city ?? "")) {
    breakdown.push({ rule: "Montreal or Laval market", points: 30 });
    points += 30;
  }

  if (input.estimatedValue > 500_000) {
    breakdown.push({ rule: "Estimated value > $500k", points: 20 });
    points += 20;
  }

  if (input.surfaceSqft > 1200) {
    breakdown.push({ rule: "Living area > 1,200 sqft", points: 15 });
    points += 15;
  }

  const msg = input.message?.trim() ?? "";
  if (msg && messageRequestsConsultation(msg)) {
    breakdown.push({ rule: "Message signals consultation intent", points: 10 });
    points += 10;
  }

  if (input.clickedConsultationCta) {
    breakdown.push({ rule: "Clicked consultation CTA", points: 10 });
    points += 10;
  }

  const call = input.clickedCall === true;
  const wa = input.clickedWhatsapp === true;
  const legacy = input.clickedCallOrWhatsapp === true && !call && !wa;

  if (call) {
    breakdown.push({ rule: "Clicked call", points: 15 });
    points += 15;
  }
  if (wa) {
    breakdown.push({ rule: "Clicked WhatsApp", points: 15 });
    points += 15;
  }
  if (legacy) {
    breakdown.push({ rule: "Call / WhatsApp engagement", points: 15 });
    points += 15;
  }

  if (input.repeatResultViews) {
    breakdown.push({ rule: "Multiple evaluation visits", points: 10 });
    points += 10;
  }

  const score = Math.min(100, Math.max(0, points));
  return {
    score,
    band: scoreBandFromPoints(score),
    breakdown,
  };
}

export function scoreBandFromPoints(score: number): CrmScoreBand {
  if (score >= 80) return "hot";
  if (score >= 50) return "warm";
  return "cold";
}

export function scoreBandLabel(band: CrmScoreBand): string {
  switch (band) {
    case "hot":
      return "HOT";
    case "warm":
      return "WARM";
    default:
      return "COLD";
  }
}
