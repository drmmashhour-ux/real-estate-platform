import type { MontrealOpportunityRow } from "@/modules/market-intelligence/market-intelligence.types";

export type DominationZone = {
  zone: string;
  priorityLevel: 1 | 2 | 3;
  actions: string[];
  expectedImpact: string;
};

/**
 * “Waves” — pick top opportunity rows; impact language is directional, not numeric fabrication.
 */
export function pickDominationZones(opportunities: MontrealOpportunityRow[], maxZones = 5): DominationZone[] {
  const top = [...opportunities].sort((a, b) => b.opportunityScore - a.opportunityScore).slice(0, maxZones);
  return top.map((o, i) => ({
    zone: `${o.neighborhood} · ${o.propertyType ?? "any"} · ${o.priceBand}`,
    priorityLevel: (i === 0 ? 1 : i < 3 ? 2 : 3) as 1 | 2 | 3,
    actions: [
      "Host outreach queue (reviewed drafts only)",
      "Calendar + pricing QA for published stays in zone",
      "Content/SEO drafts for top listings after factual review",
    ],
    expectedImpact:
      "Density-first: more qualified listings and completed bookings in-zone before expanding geography — measure with your existing funnel events.",
  }));
}
