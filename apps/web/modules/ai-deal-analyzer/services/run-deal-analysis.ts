import type { DealAnalysisResult, DealAnalyzerInput } from "./types";
import { buildMetricBlock } from "./calculate-deal-metrics";
import { buildDealSummary } from "./build-deal-summary";
import { scoreDeal } from "./score-deal";

export function mergeInputWithOverrides(
  base: DealAnalyzerInput,
  overrides: Partial<Pick<DealAnalyzerInput, "estimatedRent" | "condoFeesMonthly" | "propertyTaxAnnual" | "downPaymentPercent" | "mortgageRate" | "amortizationYears">>
): DealAnalyzerInput {
  return {
    ...base,
    ...Object.fromEntries(
      (Object.entries(overrides) as [string, unknown][]).filter(([, v]) => v !== undefined)
    ),
  } as DealAnalyzerInput;
}

export function runDealAnalysis(input: DealAnalyzerInput): DealAnalysisResult {
  const metrics = buildMetricBlock(input);
  const { score, confidence, strengths, riskFlags } = scoreDeal(input, metrics);
  const summary = buildDealSummary(input, metrics, score, confidence);
  return {
    score,
    confidence,
    metrics,
    riskFlags,
    strengths,
    summary,
  };
}
