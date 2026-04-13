import type { ContentMachineStyle } from "@prisma/client";
import { analyzeOptimizationSignals } from "@/lib/content-intelligence";
import type { ContentOptimizationSignals } from "@/lib/content-intelligence/types";

export type { ContentOptimizationSignals, ExtendedOptimizationSignals } from "@/lib/content-intelligence/types";

/**
 * @deprecated Prefer `analyzeOptimizationSignals` from `@/lib/content-intelligence`.
 * Analyzes top-percentile pieces and derives winning styles + hooks (+ CTA / city / visual signals).
 */
export async function analyzeContentOptimizationSignals(
  percentileFraction = 0.1
): Promise<ExtendedOptimizationSignals | null> {
  return analyzeOptimizationSignals(percentileFraction);
}

/** Best-performing style in the analyzed cohort (highest total weighted score contribution). */
export function getTopOptimizationStyle(signals: ContentOptimizationSignals): ContentMachineStyle | null {
  return signals.stylesRanked[0]?.style ?? null;
}
