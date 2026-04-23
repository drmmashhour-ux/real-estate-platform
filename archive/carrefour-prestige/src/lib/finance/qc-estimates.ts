/**
 * Illustrative Quebec-style welcome tax tiers — ESTIMATES ONLY.
 * Not legal/tax advice; real duties use marginal brackets and exemptions.
 */

export function welcomeTaxEstimate(priceCad: number): number {
  if (priceCad < 0 || !Number.isFinite(priceCad)) return NaN;
  if (priceCad < 500_000) return priceCad * 0.005;
  if (priceCad < 1_000_000) return priceCad * 0.01;
  return priceCad * 0.015;
}

export function closingCostRoughEstimate(priceCad: number): number {
  /** Very rough placeholder: ~1.5% of price for notary/misc (illustrative). */
  return priceCad * 0.015;
}

export function mortgagePaymentMonthly(
  principal: number,
  annualRatePct: number,
  years: number
): number {
  const n = years * 12;
  const r = annualRatePct / 100 / 12;
  if (r === 0) return principal / n;
  return (principal * r) / (1 - Math.pow(1 + r, -n));
}
