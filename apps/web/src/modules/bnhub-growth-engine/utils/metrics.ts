/** CTR as 0..1 */
export function computeCTR(impressions: number, clicks: number): number {
  if (impressions <= 0) return 0;
  return clicks / impressions;
}

/** CPL in currency minor units (e.g. cents) when spend and leads known */
export function computeCPL(spendCents: number, leads: number): number | null {
  if (leads <= 0) return null;
  return spendCents / leads;
}

/** Simple ROI ratio when revenue and spend in same units */
export function computeROI(attributedRevenueCents: number, spendCents: number): number | null {
  if (spendCents <= 0) return null;
  return (attributedRevenueCents - spendCents) / spendCents;
}
