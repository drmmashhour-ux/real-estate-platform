import { composeAnalysisResult } from "@/modules/deal-analyzer/domain/scoring";
import type { DealAnalysisResult, DealAnalyzerListingInput } from "@/modules/deal-analyzer/domain/types";

export function runDeterministicDealScore(input: DealAnalyzerListingInput): DealAnalysisResult {
  return composeAnalysisResult(input);
}
