import { computePricingComponent } from "@/modules/deal-analyzer/domain/scoring";
import type { DealAnalyzerListingInput } from "@/modules/deal-analyzer/domain/types";

export function analyzePricing(input: DealAnalyzerListingInput): { score: number; label: string } {
  const score = computePricingComponent(input);
  const label =
    score >= 72 ? "price_signal_favorable" : score >= 52 ? "price_signal_neutral" : "price_signal_stretched";
  return { score, label };
}
