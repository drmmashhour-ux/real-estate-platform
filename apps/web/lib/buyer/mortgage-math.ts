/**
 * Simple affordability helpers (illustrative only — not a commitment to lend).
 */

/** Monthly payment (principal + interest) for a fixed-rate amortizing loan. */
export function monthlyMortgagePayment(params: {
  principal: number;
  annualInterestPercent: number;
  amortizationYears: number;
}): number {
  const { principal, annualInterestPercent, amortizationYears } = params;
  const n = Math.max(1, Math.round(amortizationYears * 12));
  const r = annualInterestPercent / 100 / 12;
  if (principal <= 0) return 0;
  if (r <= 0) return principal / n;
  const factor = Math.pow(1 + r, n);
  return (principal * r * factor) / (factor - 1);
}

/** Rough gross annual income implied by a housing payment (Canadian-style stress approx). */
export function estimatedGrossIncomeRequired(monthlyHousingPayment: number, grossDebtServiceRatio = 0.32): number {
  if (grossDebtServiceRatio <= 0) return 0;
  return (monthlyHousingPayment / grossDebtServiceRatio) * 12;
}

/** Total interest paid over the life of the loan (for display). */
export function totalInterestPaid(
  principal: number,
  annualInterestPercent: number,
  amortizationYears: number
): number {
  const pmt = monthlyMortgagePayment({ principal, annualInterestPercent, amortizationYears });
  const n = Math.max(1, Math.round(amortizationYears * 12));
  return Math.max(0, pmt * n - principal);
}
