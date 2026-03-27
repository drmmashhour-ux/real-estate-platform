/**
 * Illustrative deal math — transparent formulas, no fake precision.
 * Not financial advice; null when inputs are insufficient.
 * Mortgage P&I uses shared helpers in `@/modules/mortgage/services/calculate-mortgage`.
 */

import {
  roundMoney,
  calculateDownPayment,
  calculateLoanAmount,
  calculateMonthlyMortgage,
} from "@/modules/mortgage/services/calculate-mortgage";
import type { DealAnalyzerInput, DealMetricBlock } from "./types";

const DEFAULT_DOWN_PCT = 20;
const DEFAULT_RATE = 5.5;
const DEFAULT_AMORT_YEARS = 25;

export { roundMoney };

export function roundPct(n: number): number {
  return Math.round(n * 10) / 10;
}

export function effectiveDownPaymentPercent(input: DealAnalyzerInput): number {
  const v = input.downPaymentPercent;
  if (v == null || Number.isNaN(v) || v < 0 || v > 95) return DEFAULT_DOWN_PCT;
  return Math.min(95, Math.max(0, v));
}

export function effectiveMortgageRate(input: DealAnalyzerInput): number {
  const v = input.mortgageRate;
  if (v == null || Number.isNaN(v) || v < 0 || v > 25) return DEFAULT_RATE;
  return v;
}

export function effectiveAmortizationYears(input: DealAnalyzerInput): number {
  const v = input.amortizationYears;
  if (v == null || Number.isNaN(v) || v < 5 || v > 40) return DEFAULT_AMORT_YEARS;
  return Math.floor(v);
}

/** Down payment in dollars from list price (shared mortgage helper). */
export const estimatedDownPayment = calculateDownPayment;

/** Loan principal after down payment. */
export const mortgagePrincipal = calculateLoanAmount;

/**
 * Fixed-rate monthly payment (principal + interest).
 * annualRatePercent: e.g. 5.5 for 5.5%.
 */
export function monthlyMortgagePayment(
  principal: number,
  annualRatePercent: number,
  amortizationYears: number
): number | null {
  return calculateMonthlyMortgage({
    principal,
    annualRate: annualRatePercent,
    amortizationYears,
  });
}

/** Property tax + condo + small insurance placeholder (optional). */
export function estimatedMonthlyExpenses(input: DealAnalyzerInput, price: number): number | null {
  let sum = 0;
  let has = false;
  if (input.propertyTaxAnnual != null && input.propertyTaxAnnual >= 0) {
    sum += input.propertyTaxAnnual / 12;
    has = true;
  }
  if (input.condoFeesMonthly != null && input.condoFeesMonthly >= 0) {
    sum += input.condoFeesMonthly;
    has = true;
  }
  if (!has) {
    // Rough placeholder only when nothing else: ~0.15% of value / year for insurance/maintenance bucket
    if (Number.isFinite(price) && price > 0) {
      return roundMoney((price * 0.0015) / 12);
    }
    return null;
  }
  return roundMoney(sum);
}

export function grossYield(price: number, estimatedMonthlyRent: number | null): number | null {
  if (!Number.isFinite(price) || price <= 0) return null;
  if (estimatedMonthlyRent == null || !Number.isFinite(estimatedMonthlyRent) || estimatedMonthlyRent <= 0) {
    return null;
  }
  const annual = estimatedMonthlyRent * 12;
  return roundPct((annual / price) * 100);
}

export function estimatedMonthlyCashFlow(
  estimatedMonthlyRent: number | null,
  monthlyMortgage: number | null,
  monthlyExpenses: number | null
): number | null {
  if (estimatedMonthlyRent == null || !Number.isFinite(estimatedMonthlyRent)) return null;
  const m = monthlyMortgage ?? 0;
  const e = monthlyExpenses ?? 0;
  return roundMoney(estimatedMonthlyRent - m - e);
}

/** Simple affordability: mortgage + expenses vs gross monthly rent (if rent provided). */
export function simpleAffordabilityEstimate(
  estimatedMonthlyRent: number | null,
  monthlyMortgage: number | null,
  monthlyExpenses: number | null
): "tight" | "moderate" | "comfortable" | null {
  if (estimatedMonthlyRent == null || estimatedMonthlyRent <= 0) return null;
  const burden = (monthlyMortgage ?? 0) + (monthlyExpenses ?? 0);
  const ratio = burden / estimatedMonthlyRent;
  if (ratio > 1.15) return "tight";
  if (ratio > 0.85) return "moderate";
  return "comfortable";
}

export function buildMetricBlock(input: DealAnalyzerInput): DealMetricBlock {
  const price = input.price;
  const downPct = effectiveDownPaymentPercent(input);
  const down = calculateDownPayment(price, downPct);
  const principal = down != null ? calculateLoanAmount(price, down) : null;
  const rate = effectiveMortgageRate(input);
  const years = effectiveAmortizationYears(input);
  const mortgage =
    principal != null
      ? calculateMonthlyMortgage({ principal, annualRate: rate, amortizationYears: years })
      : null;
  const expenses = estimatedMonthlyExpenses(input, price);
  const yieldPct = grossYield(price, input.estimatedRent);
  const cash = estimatedMonthlyCashFlow(input.estimatedRent, mortgage, expenses);

  return {
    monthlyMortgagePayment: mortgage,
    estimatedMonthlyExpenses: expenses,
    estimatedMonthlyCashFlow: cash,
    grossYield: yieldPct,
    estimatedDownPayment: down,
    mortgagePrincipal: principal,
  };
}
