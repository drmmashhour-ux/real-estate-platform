/**
 * Monthly mortgage payment (principal + interest) in cents — amortizing loan.
 * Same math as Phase 2 financing helper; kept separate for affordability clarity.
 */
export function estimateMonthlyPaymentCents(args: {
  principalCents: number;
  annualRate: number;
  termYears: number;
}): number | null {
  const p = args.principalCents;
  if (p <= 0 || args.termYears <= 0) return null;
  const monthlyRate = args.annualRate / 12;
  const n = args.termYears * 12;
  if (monthlyRate <= 0) return Math.round(p / n);
  const factor = Math.pow(1 + monthlyRate, n);
  const pay = (p * monthlyRate * factor) / (factor - 1);
  if (!Number.isFinite(pay) || pay <= 0) return null;
  return Math.round(pay);
}
