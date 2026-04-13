import type { RevenueListingContext } from "./types";

export type RevenueOpportunity = {
  listing: RevenueListingContext;
  opportunityType: string;
  notes: string;
  estimatedUpliftCents: number;
};

function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/** Heuristic upside from closing conversion gap × ADR proxy. */
function estimateUplift(l: RevenueListingContext): number {
  const adr = Math.max(1, l.nightPriceCents);
  const views = Math.max(0, l.views30d);
  const conv = l.conversionRate ?? 0.015;
  const gap = Math.max(0, 0.025 - conv);
  return Math.round(gap * views * adr * 0.12);
}

export function getRevenueOpportunities(listings: RevenueListingContext[]): RevenueOpportunity[] {
  if (listings.length === 0) return [];
  const medConv =
    median(listings.map((x) => (x.conversionRate != null ? x.conversionRate : 0.012))) || 0.012;
  const medRev = median(listings.map((x) => x.revenue90dCents));
  const out: RevenueOpportunity[] = [];

  for (const l of listings) {
    const conv = l.conversionRate ?? 0;
    if (l.revenue90dCents >= medRev * 1.4 && conv >= medConv * 1.1) {
      out.push({
        listing: l,
        opportunityType: "scale_winner",
        notes: "Strong earner with healthy conversion — candidate for promotion and merchandising.",
        estimatedUpliftCents: Math.round(l.revenue90dCents * 0.08),
      });
    }
    if (l.views30d > 80 && l.revenue90dCents < medRev * 0.5) {
      out.push({
        listing: l,
        opportunityType: "traffic_not_monetizing",
        notes: "Traffic without matching revenue — pricing, photos, or trust gap.",
        estimatedUpliftCents: estimateUplift(l),
      });
    }
    if (l.pricingScore < 52 && l.views30d > 30) {
      out.push({
        listing: l,
        opportunityType: "pricing_efficiency",
        notes: "Pricing competitiveness score is soft — peer review and test promotions.",
        estimatedUpliftCents: Math.round(medRev * 0.05),
      });
    }
  }

  const seen = new Set<string>();
  return out
    .filter((o) => {
      const k = `${o.listing.listingId}:${o.opportunityType}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .sort((a, b) => b.estimatedUpliftCents - a.estimatedUpliftCents)
    .slice(0, 15);
}
