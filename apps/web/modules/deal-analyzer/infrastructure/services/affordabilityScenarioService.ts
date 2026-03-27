import { dealAnalyzerConfig } from "@/config/dealAnalyzer";

/** Defaults when caller omits rate/term — same as Phase 2 financing defaults. */
export function defaultAffordabilityAssumptions(): { annualRate: number; termYears: number } {
  return {
    annualRate: dealAnalyzerConfig.scenario.financing.defaultApr,
    termYears: dealAnalyzerConfig.scenario.financing.defaultTermYears,
  };
}
