import { computeIncomeComponent } from "@/modules/deal-analyzer/domain/scoring";
import type { DealAnalyzerListingInput } from "@/modules/deal-analyzer/domain/types";

/** Phase 1: only emits a score when minimum rental signals exist — no fabricated market rent. */
export function projectRentSignal(input: DealAnalyzerListingInput): {
  incomeScore: number | null;
  note: string;
} {
  const incomeScore = computeIncomeComponent(input);
  if (incomeScore == null) {
    return {
      incomeScore: null,
      note: "Insufficient structured signals to estimate rental yield — income dimension omitted from the headline score.",
    };
  }
  return {
    incomeScore,
    note: "Rough internal yield heuristic only — not a rent comp or appraisal.",
  };
}
