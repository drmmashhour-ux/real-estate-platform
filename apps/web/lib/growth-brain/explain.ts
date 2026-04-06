import type { GrowthBrainDomain } from "./types";

/**
 * Human-readable explanations for operators (no fabricated statistics).
 */
export function explainDemandGap(city: string, demandIndex: number, supplyCount: number): string {
  return `Engagement-weighted demand signals for ${city} are elevated relative to visible inventory (${supplyCount} active listings in sample). Review supply acquisition in this market.`;
}

export function explainBuyerIntent(tier: string, signals: string[]): string {
  return `Session classified as ${tier.replace(/_/g, " ")} based on: ${signals.join("; ")}.`;
}

export function explainStaleLeads(count: number, city: string | null): string {
  const where = city ? `in ${city}` : "across cities";
  return `${count} growth leads ${where} need follow-up based on stage and recency rules.`;
}

export function explainSeoGap(city: string, count: number): string {
  return `There are ${count} listings associated with ${city}, but curated landing/collection coverage may be thin — consider a compliant SEO page using only verified inventory and disclosures.`;
}

export function explainUnlockFunnel(ratio: number | null): string {
  if (ratio == null || Number.isNaN(ratio)) {
    return "Insufficient unlock funnel data to compare start vs success rates.";
  }
  return `Observed unlock checkout success ratio in sampled analytics is ${(ratio * 100).toFixed(0)}% of starts — tune copy and pricing only with operator review.`;
}

export function composeRecommendationWhy(domain: GrowthBrainDomain, bullets: string[]): string {
  const header =
    domain === "supply"
      ? "Supply opportunity"
      : domain === "demand"
        ? "Demand signal"
        : domain === "seo"
          ? "SEO coverage"
          : domain === "conversion"
            ? "Conversion friction"
            : domain === "revenue"
              ? "Monetization"
              : domain === "retention"
                ? "Retention"
                : "Growth";
  return `${header}: ${bullets.filter(Boolean).join(" ")}`;
}
