/**
 * Illustrative monthly principal & interest — not a pre-approval or offer.
 * Uses fixed assumptions for a quick “financing ballpark” in the analyzer.
 */
export function approximateMonthlyMortgagePayment(
  propertyPrice: number,
  opts?: { ltv?: number; annualRate?: number; years?: number }
): number {
  const ltv = opts?.ltv ?? 0.8;
  const annualRate = opts?.annualRate ?? 0.055;
  const years = opts?.years ?? 25;
  if (propertyPrice <= 0) return 0;
  const principal = propertyPrice * ltv;
  const months = years * 12;
  const r = annualRate / 12;
  if (r === 0) return principal / months;
  return (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
}
