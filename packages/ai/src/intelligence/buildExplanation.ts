import type { IntelligenceDomain, IntelligenceScores, ListingSignals } from "@/lib/ai/core/types";

/**
 * Short human-readable copy for guests, hosts, and admin (no raw model internals).
 */
export function buildExplanation(
  domain: IntelligenceDomain,
  scores: IntelligenceScores,
  listing: ListingSignals
): string {
  const parts: string[] = [];

  if (scores.demandScore >= 0.72) {
    parts.push("High demand and strong recent interest support visibility.");
  } else if (scores.demandScore < 0.35) {
    parts.push("Demand signals are soft — consider pricing and content improvements.");
  }

  if (scores.priceCompetitiveness >= 0.82) {
    parts.push("Pricing looks competitive for this market.");
  } else if (scores.priceCompetitiveness < 0.45) {
    parts.push("Price sits above typical peers in this area.");
  }

  if (listing.qualityFlags.lowPhotoCount || listing.qualityFlags.weakDescription) {
    parts.push("Low photo count or a thin description can reduce conversion potential.");
  }

  if (domain === "search" || domain === "recommendation") {
    if (scores.personalizationScore >= 0.65) {
      parts.push(`This listing performs well for users searching in ${listing.city}.`);
    }
  }

  if (parts.length === 0) {
    return "Signals are balanced — continue monitoring bookings and guest feedback.";
  }
  return parts.slice(0, 3).join(" ");
}

export function buildTrendLabel(listing: ListingSignals): string | null {
  const d = listing.demandScore;
  const v = listing.views7d;
  if (d >= 0.65 && v >= 8) return "Rising";
  if (d >= 0.45 && d < 0.65) return "Stable";
  if (d < 0.38) return "Cooling";
  return null;
}

export function publicValueLabel(
  scores: IntelligenceScores
): "Great value" | "Fair value" | "Premium pricing" {
  if (scores.priceCompetitiveness >= 0.78 && scores.demandScore >= 0.45) return "Great value";
  if (scores.priceCompetitiveness < 0.42) return "Premium pricing";
  return "Fair value";
}

export function publicDemandLabel(scores: IntelligenceScores): "High" | "Moderate" | "Low" {
  if (scores.demandScore >= 0.65) return "High";
  if (scores.demandScore >= 0.38) return "Moderate";
  return "Low";
}
