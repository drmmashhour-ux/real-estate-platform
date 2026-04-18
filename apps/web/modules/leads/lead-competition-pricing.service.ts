import type { BrokerCompetitionProfile } from "@/modules/brokers/broker-competition.types";

export type LeadPricingInput = {
  dynamicLeadPriceCents?: number | null;
  score?: number | null;
};

export type LeadCompetitionPricingResult = {
  basePriceCents: number;
  suggestedPriceCents: number;
  multiplier: number;
  reason: string;
};

/**
 * Advisory multiplier only — does not charge brokers or mutate lead rows.
 */
export function adjustLeadPricingWithCompetition(
  lead: LeadPricingInput,
  brokers: BrokerCompetitionProfile[],
): LeadCompetitionPricingResult {
  const base = lead.dynamicLeadPriceCents ?? 10_000;
  const strong = brokers.filter((b) => b.tier === "preferred" || b.tier === "elite");
  const elite = brokers.filter((b) => b.tier === "elite");

  let mult = 1;
  const parts: string[] = [];

  if (strong.length >= 3) {
    mult += 0.08;
    parts.push("multiple strong brokers competing");
  }
  if (elite.length >= 2) {
    mult += 0.1;
    parts.push("elite-tier competition");
  }
  if ((lead.score ?? 0) >= 75) {
    mult += 0.05;
    parts.push("high lead score");
  }

  const multiplier = Math.round(mult * 100) / 100;
  const suggested = Math.round(base * multiplier);

  return {
    basePriceCents: base,
    suggestedPriceCents: suggested,
    multiplier,
    reason:
      parts.length > 0
        ? `Suggested +${Math.round((multiplier - 1) * 100)}%: ${parts.join("; ")}.`
        : "No competition premium applied — baseline price.",
  };
}
