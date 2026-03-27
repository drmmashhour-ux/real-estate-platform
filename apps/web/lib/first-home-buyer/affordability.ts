/**
 * Affordability helpers — illustrative only. Not mortgage approval or legal advice.
 */

export type AffordabilityInputs = {
  annualIncome: number;
  monthlyDebtPayments: number;
  downPayment: number;
  purchasePrice: number;
  interestRatePercent: number;
  amortizationYears: number;
  /** Optional closing costs (dollars) — used for cash-needed notes */
  estimatedClosingCosts?: number;
  /** GDS ratio cap (default 0.32) */
  gdsRatio?: number;
  /** TDS ratio cap (default 0.40) */
  tdsRatio?: number;
};

export type AffordabilityOutputs = {
  maxMonthlyHousingPaymentGds: number;
  maxMonthlyHousingPaymentTds: number;
  limitingPayment: number;
  estimatedMonthlyPayment: number;
  estimatedAffordabilityRangeLow: number;
  estimatedAffordabilityRangeHigh: number;
  totalCashNeeded: number;
  notes: string[];
};

function monthlyPayment(principal: number, annualRatePercent: number, years: number): number {
  if (principal <= 0 || years <= 0) return 0;
  const n = years * 12;
  const r = annualRatePercent / 100 / 12;
  if (r === 0) return principal / n;
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

/** Approximate max loan from payment cap (inverse of amortization). */
function maxLoanFromPayment(maxPayment: number, annualRatePercent: number, years: number): number {
  if (maxPayment <= 0 || years <= 0) return 0;
  const n = years * 12;
  const r = annualRatePercent / 100 / 12;
  if (r === 0) return maxPayment * n;
  return (maxPayment * (Math.pow(1 + r, n) - 1)) / (r * Math.pow(1 + r, n));
}

export function computeAffordability(input: AffordabilityInputs): AffordabilityOutputs {
  const gds = input.gdsRatio ?? 0.32;
  const tds = input.tdsRatio ?? 0.4;
  const income = Math.max(0, input.annualIncome);
  const monthlyIncome = income / 12;
  const debts = Math.max(0, input.monthlyDebtPayments);

  const maxHousingGds = Math.max(0, monthlyIncome * gds);
  const maxHousingTds = Math.max(0, monthlyIncome * tds - debts);
  const limitingPayment = Math.max(0, Math.min(maxHousingGds, maxHousingTds));

  const loan = Math.max(0, input.purchasePrice - input.downPayment);
  const pay = monthlyPayment(loan, input.interestRatePercent, input.amortizationYears);

  const maxLoan = maxLoanFromPayment(limitingPayment, input.interestRatePercent, input.amortizationYears);
  const maxPrice = maxLoan + input.downPayment;
  const low = Math.max(0, Math.round(maxPrice * 0.85));
  const high = Math.max(low, Math.round(maxPrice * 1.05));

  const closing = input.estimatedClosingCosts ?? 0;
  const totalCash = input.downPayment + closing;

  const notes: string[] = [
    "Ratios shown are illustrative (GDS/TDS-style caps). Actual approval depends on lender, stress test, and credit.",
    "Program eligibility and tax incentives should be verified with a qualified professional.",
  ];

  return {
    maxMonthlyHousingPaymentGds: maxHousingGds,
    maxMonthlyHousingPaymentTds: maxHousingTds,
    limitingPayment,
    estimatedMonthlyPayment: pay,
    estimatedAffordabilityRangeLow: low,
    estimatedAffordabilityRangeHigh: high,
    totalCashNeeded: totalCash,
    notes,
  };
}

/** Minimum down payment percent for owner-occupied (simplified tiers). */
export function estimateMinimumDownPercent(purchasePrice: number): number {
  if (purchasePrice <= 500_000) return 5;
  if (purchasePrice <= 1_500_000) {
    // blended: first 500k at 5%, remainder at 10% — return effective minimum % rounded
    const first = 500_000 * 0.05;
    const rest = (purchasePrice - 500_000) * 0.1;
    return ((first + rest) / purchasePrice) * 100;
  }
  return 20;
}
