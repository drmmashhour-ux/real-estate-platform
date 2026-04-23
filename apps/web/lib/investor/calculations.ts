export function monthlyMortgagePayment(input: {
  principalCents: number;
  annualInterestRate: number;
  amortizationYears: number;
}) {
  const P = input.principalCents / 100;
  const r = input.annualInterestRate / 12;
  const n = input.amortizationYears * 12;

  if (!P || !n) return 0;
  if (!r) return Math.round((P / n) * 100);

  const payment = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  return Math.round(payment * 100);
}

export function computeMonthlyOperatingIncome(input: {
  monthlyRentCents?: number;
  otherMonthlyIncomeCents?: number;
}) {
  return (input.monthlyRentCents ?? 0) + (input.otherMonthlyIncomeCents ?? 0);
}

export function computeMonthlyOperatingExpenses(input: {
  monthlyTaxesCents?: number;
  monthlyInsuranceCents?: number;
  monthlyUtilitiesCents?: number;
  monthlyMaintenanceCents?: number;
  monthlyManagementCents?: number;
  monthlyVacancyCents?: number;
  monthlyOtherExpensesCents?: number;
}) {
  return (
    (input.monthlyTaxesCents ?? 0) +
    (input.monthlyInsuranceCents ?? 0) +
    (input.monthlyUtilitiesCents ?? 0) +
    (input.monthlyMaintenanceCents ?? 0) +
    (input.monthlyManagementCents ?? 0) +
    (input.monthlyVacancyCents ?? 0) +
    (input.monthlyOtherExpensesCents ?? 0)
  );
}

export function computeMonthlyCashflow(input: {
  monthlyIncomeCents: number;
  monthlyExpensesCents: number;
  monthlyMortgageCents?: number;
}) {
  return input.monthlyIncomeCents - input.monthlyExpensesCents - (input.monthlyMortgageCents ?? 0);
}

export function computeAnnualCashflow(monthlyCashflowCents: number) {
  return monthlyCashflowCents * 12;
}

export function computeNOI(input: { monthlyIncomeCents: number; monthlyExpensesCents: number }) {
  return (input.monthlyIncomeCents - input.monthlyExpensesCents) * 12;
}

export function computeCapRate(input: { noiAnnualCents: number; purchasePriceCents: number }) {
  if (!input.purchasePriceCents) return 0;
  return input.noiAnnualCents / input.purchasePriceCents;
}

export function computeGRM(input: { purchasePriceCents: number; annualGrossRentCents: number }) {
  if (!input.annualGrossRentCents) return 0;
  return input.purchasePriceCents / input.annualGrossRentCents;
}

export function computeCashOnCashReturn(input: {
  annualCashflowCents: number;
  cashInvestedCents: number;
}) {
  if (!input.cashInvestedCents) return 0;
  return input.annualCashflowCents / input.cashInvestedCents;
}

export function computeROI(input: { annualCashflowCents: number; totalInvestedCents: number }) {
  if (!input.totalInvestedCents) return 0;
  return input.annualCashflowCents / input.totalInvestedCents;
}

export function computeDSCR(input: { noiAnnualCents: number; annualDebtServiceCents: number }) {
  if (!input.annualDebtServiceCents) return 0;
  return input.noiAnnualCents / input.annualDebtServiceCents;
}

export function computeBreakEvenOccupancy(input: {
  operatingExpensesAnnualCents: number;
  debtServiceAnnualCents: number;
  grossPotentialRentAnnualCents: number;
}) {
  if (!input.grossPotentialRentAnnualCents) return 0;
  return (
    (input.operatingExpensesAnnualCents + input.debtServiceAnnualCents) /
    input.grossPotentialRentAnnualCents
  );
}
