/**
 * Conservative risk tiers from observable signals — not predictive of outcomes.
 */

import type { RevenueForecastRisk } from "@/modules/growth/revenue-forecast.types";

export type RevenueRiskInput = {
  leadsCount: number;
  dropOffRatio: number;
  executionCompletionRate: number | null;
  sparsePipeline: boolean;
  inconsistentSignals: boolean;
};

function tier(v: number, low: number, high: number): "low" | "medium" | "high" {
  if (v <= low) return "low";
  if (v >= high) return "high";
  return "medium";
}

/** dropOffRatio: 1 - qualified/max(leads,1). executionCompletionRate 0–1 or null → treated as unknown (medium data risk). */
export function computeRevenueRisk(input: RevenueRiskInput): RevenueForecastRisk {
  const dropOffRisk = tier(input.dropOffRatio, 0.35, 0.72);
  const executionRisk =
    input.executionCompletionRate == null
      ? "medium"
      : tier(1 - input.executionCompletionRate, 0.35, 0.65);

  let dataRisk: RevenueForecastRisk["dataRisk"] = "low";
  if (input.sparsePipeline || input.leadsCount < 8) dataRisk = "high";
  else if (input.leadsCount < 20 || input.executionCompletionRate == null) dataRisk = "medium";

  if (input.inconsistentSignals) {
    dataRisk = dataRisk === "low" ? "medium" : "high";
  }

  return { dropOffRisk, executionRisk, dataRisk };
}
