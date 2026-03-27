/**
 * Pure mortgage / carrying-cost helpers (no I/O).
 * Illustrative only — not a lender quote.
 */

export function roundMoney(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100) / 100;
}

export function calculateDownPayment(price: number, downPaymentPercent: number): number | null {
  if (!Number.isFinite(price) || price <= 0) return null;
  if (!Number.isFinite(downPaymentPercent) || downPaymentPercent < 0 || downPaymentPercent > 100) return null;
  return roundMoney((price * downPaymentPercent) / 100);
}

/** Loan principal after down payment (dollars). */
export function calculateLoanAmount(price: number, downPaymentDollars: number): number | null {
  if (!Number.isFinite(price) || price <= 0) return null;
  if (!Number.isFinite(downPaymentDollars) || downPaymentDollars < 0) return null;
  const loan = price - downPaymentDollars;
  return loan > 0 ? roundMoney(loan) : null;
}

/**
 * Fixed-rate monthly payment (principal + interest).
 * annualRate: nominal annual percent, e.g. 5.5 for 5.5%.
 */
export function calculateMonthlyMortgage({
  principal,
  annualRate,
  amortizationYears,
}: {
  principal: number;
  annualRate: number;
  amortizationYears: number;
}): number | null {
  if (!Number.isFinite(principal) || principal <= 0) return null;
  if (!Number.isFinite(annualRate) || annualRate < 0) return null;
  if (!Number.isFinite(amortizationYears) || amortizationYears <= 0) return null;

  const n = Math.max(1, Math.floor(amortizationYears * 12));
  const r = annualRate / 100 / 12;
  if (r === 0) return roundMoney(principal / n);
  const pow = (1 + r) ** n;
  const m = (principal * r * pow) / (pow - 1);
  return roundMoney(m);
}

export function estimateMonthlyTaxes(annualTax: number | null | undefined): number | null {
  if (annualTax == null || !Number.isFinite(annualTax) || annualTax < 0) return null;
  return roundMoney(annualTax / 12);
}

/** Rough placeholder: ~0.25% of home value per year → monthly. */
export function estimateMonthlyInsurance(price: number | null | undefined): number | null {
  if (price == null || !Number.isFinite(price) || price <= 0) return null;
  return roundMoney((price * 0.0025) / 12);
}

export function estimateTotalMonthlyCost(parts: {
  monthlyMortgage: number;
  monthlyPropertyTax?: number | null;
  monthlyInsurance?: number | null;
  monthlyCondoFees?: number | null;
}): number {
  const m = Number.isFinite(parts.monthlyMortgage) ? parts.monthlyMortgage : 0;
  const t = parts.monthlyPropertyTax != null && Number.isFinite(parts.monthlyPropertyTax) ? parts.monthlyPropertyTax : 0;
  const i = parts.monthlyInsurance != null && Number.isFinite(parts.monthlyInsurance) ? parts.monthlyInsurance : 0;
  const c = parts.monthlyCondoFees != null && Number.isFinite(parts.monthlyCondoFees) ? parts.monthlyCondoFees : 0;
  return roundMoney(m + t + i + c);
}
