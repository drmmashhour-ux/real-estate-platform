/**
 * Rental ROI / cash-flow calculators — informational estimates only.
 * Not investment, tax, or legal advice.
 */

export type RoiInputs = {
  purchasePrice: number;
  downPayment: number;
  // annual % e.g. 5.5 for 5.5%
  mortgageInterestRate: number;
  amortizationYears: number;
  monthlyRent: number;
  vacancyRatePercent: number;
  propertyTaxAnnual: number;
  condoFeesAnnual: number;
  insuranceAnnual: number;
  managementAnnual: number;
  repairsReserveAnnual: number;
  closingCosts: number;
  welcomeTax: number;
  otherMonthlyExpenses: number;
  otherAnnualExpenses: number;
};

export type RoiOutputs = {
  grossAnnualIncome: number;
  grossYieldPercent: number;
  annualOperatingExpenses: number;
  annualDebtService: number;
  annualCashFlow: number;
  monthlyCashFlow: number;
  capRatePercent: number;
  cashOnCashPercent: number;
  roiPercent: number;
  loanAmount: number;
  monthlyMortgagePayment: number;
  effectiveMonthlyRent: number;
};

/** Standard amortizing monthly payment (Canadian monthly compounding). */
export function monthlyMortgagePayment(
  principal: number,
  annualRatePercent: number,
  amortizationYears: number
): number {
  if (principal <= 0 || amortizationYears <= 0) return 0;
  const n = amortizationYears * 12;
  const r = annualRatePercent / 100 / 12;
  if (r === 0) return principal / n;
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

export function computeRoi(inputs: RoiInputs): RoiOutputs {
  const price = Math.max(0, inputs.purchasePrice);
  const down = Math.max(0, Math.min(inputs.downPayment, price));
  const loan = Math.max(0, price - down);
  const rate = Math.max(0, inputs.mortgageInterestRate);
  const years = Math.max(1, inputs.amortizationYears);

  const monthlyPayment = monthlyMortgagePayment(loan, rate, years);
  const annualDebtService = monthlyPayment * 12;

  const vacancy = Math.max(0, Math.min(100, inputs.vacancyRatePercent));
  const effectiveMonthlyRent = inputs.monthlyRent * (1 - vacancy / 100);
  const grossAnnualIncome = effectiveMonthlyRent * 12;

  const operatingAnnual =
    inputs.propertyTaxAnnual +
    inputs.condoFeesAnnual +
    inputs.insuranceAnnual +
    inputs.managementAnnual +
    inputs.repairsReserveAnnual +
    inputs.otherAnnualExpenses +
    inputs.otherMonthlyExpenses * 12;

  const noi = grossAnnualIncome - operatingAnnual;

  const annualCashFlow = noi - annualDebtService;
  const monthlyCashFlow = annualCashFlow / 12;

  const grossYieldPercent = price > 0 ? (grossAnnualIncome / price) * 100 : 0;
  const capRatePercent = price > 0 ? (noi / price) * 100 : 0;

  const totalCashInvested = down + Math.max(0, inputs.closingCosts) + Math.max(0, inputs.welcomeTax);
  const cashOnCashPercent = totalCashInvested > 0 ? (annualCashFlow / totalCashInvested) * 100 : 0;
  /** Year-1 ROI — aligned with cash-on-cash return on equity invested. */
  const roiPercent = cashOnCashPercent;

  return {
    grossAnnualIncome,
    grossYieldPercent,
    annualOperatingExpenses: operatingAnnual,
    annualDebtService,
    annualCashFlow,
    monthlyCashFlow,
    capRatePercent,
    cashOnCashPercent,
    roiPercent,
    loanAmount: loan,
    monthlyMortgagePayment: monthlyPayment,
    effectiveMonthlyRent,
  };
}
