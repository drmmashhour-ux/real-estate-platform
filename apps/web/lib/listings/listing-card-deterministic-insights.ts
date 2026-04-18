/**
 * Deterministic, non-fabricated micro-copy for listing cards (median compare only when median is known).
 */

export type ListingCardInsightInput = {
  priceCents: number;
  city: string;
  bedrooms: number | null;
  /** Map / browse median ask in dollars — from `computeMapSearchStats` when available */
  medianPriceDollars?: number | null;
};

export function getListingCardDeterministicInsights(input: ListingCardInsightInput): string[] {
  const out: string[] = [];
  const ask = input.priceCents / 100;
  const med = input.medianPriceDollars;
  if (typeof med === "number" && med > 0 && Number.isFinite(ask)) {
    if (ask < med * 0.97) out.push("Below median for current map results");
    else if (ask > med * 1.08) out.push("Above median for current map results");
  }
  const city = input.city.toLowerCase();
  if (/(montréal|montreal|laval|gatineau|québec|quebec)/i.test(city)) {
    out.push("Active Québec market");
  }
  if (input.bedrooms != null && input.bedrooms >= 3) {
    out.push("3+ bedrooms");
  }
  return out.slice(0, 2);
}
