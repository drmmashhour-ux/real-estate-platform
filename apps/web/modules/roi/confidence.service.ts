import { OPTIMIZATION_SCENARIOS } from "./assumptions.constants";

export type ConfidenceLevel = "low" | "medium" | "high";

export function resolveConfidence(input: {
  hasAnnualRevenueOverride: boolean;
  hasNightlyPath: boolean;
  optimizationGainPercent: number;
}): ConfidenceLevel {
  if (!input.hasAnnualRevenueOverride && !input.hasNightlyPath) return "low";
  if (input.optimizationGainPercent >= OPTIMIZATION_SCENARIOS.aggressive.gainPercent) return "low";
  if (input.optimizationGainPercent > OPTIMIZATION_SCENARIOS.standard.gainPercent) return "medium";
  if (input.hasAnnualRevenueOverride) return "medium";
  return "medium";
}

export const ROI_DISCLAIMERS = {
  model:
    "This is a model based on your inputs and selected assumptions. Results are not guaranteed and depend on occupancy, pricing, demand, and listing quality.",
  optimization:
    "Optimization gains are scenario estimates, not verified outcomes or external market benchmarks.",
  competitor:
    "Competitor fee defaults are illustrative unless you enter your actual platform fee.",
} as const;
