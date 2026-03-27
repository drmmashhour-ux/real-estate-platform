import { computeReadinessComponent } from "@/modules/deal-analyzer/domain/scoring";
import type { DealAnalyzerListingInput } from "@/modules/deal-analyzer/domain/types";

export function analyzeReadiness(input: DealAnalyzerListingInput): { score: number } {
  return { score: computeReadinessComponent(input) };
}
