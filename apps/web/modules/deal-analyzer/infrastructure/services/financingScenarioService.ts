import { dealAnalyzerConfig } from "@/config/dealAnalyzer";

/** Standard amortizing loan; returns null if inputs invalid. */
export function estimateMonthlyMortgagePaymentCents(args: {
  loanPrincipalCents: number;
  annualRate: number;
  termYears: number;
}): number | null {
  const principal = args.loanPrincipalCents;
  if (principal <= 0 || args.termYears <= 0) return null;
  const monthlyRate = args.annualRate / 12;
  const n = args.termYears * 12;
  if (monthlyRate <= 0) return Math.round(principal / n);
  const factor = Math.pow(1 + monthlyRate, n);
  const pay = (principal * monthlyRate * factor) / (factor - 1);
  if (!Number.isFinite(pay) || pay <= 0) return null;
  return Math.round(pay);
}

export function defaultFinancingParams(): { apr: number; termYears: number } {
  return {
    apr: dealAnalyzerConfig.scenario.financing.defaultApr,
    termYears: dealAnalyzerConfig.scenario.financing.defaultTermYears,
  };
}
