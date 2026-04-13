import type { RevenueListingContext } from "./types";

export type RevenueLeak = {
  listing: RevenueListingContext;
  reason: string;
};

function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/** Listings with strong traffic but weak monetization vs portfolio. */
export function getRevenueLeaks(listings: RevenueListingContext[]): RevenueLeak[] {
  if (listings.length === 0) return [];
  const views = listings.map((l) => l.views30d);
  const revs = listings.map((l) => l.revenue90dCents);
  const medV = median(views);
  const medR = median(revs.filter((r) => r > 0).length ? revs.filter((r) => r > 0) : [0]);
  const out: RevenueLeak[] = [];

  for (const l of listings) {
    if (l.views30d >= Math.max(25, medV * 0.85) && l.revenue90dCents < Math.max(medR * 0.45, 1)) {
      out.push({
        listing: l,
        reason: "High visibility vs peer median but revenue trails — conversion, pricing, or calendar friction.",
      });
    }
    if (
      l.conversionRate != null &&
      l.conversionRate < 0.012 &&
      l.views30d > 40 &&
      l.revenue90dCents < medR
    ) {
      out.push({
        listing: l,
        reason: "Low conversion rate relative to traffic — tighten hero content, trust, and checkout friction.",
      });
    }
  }

  const seen = new Set<string>();
  return out.filter((x) => {
    if (seen.has(x.listing.listingId)) return false;
    seen.add(x.listing.listingId);
    return true;
  }).slice(0, 12);
}
