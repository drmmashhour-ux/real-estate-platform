/**
 * In-process counters for monetization control layer — [lead:monetization-control] logs; never throws.
 */

const LOG = "[lead:monetization-control]";

export type LeadMonetizationControlMonitoringSnapshot = {
  summariesBuilt: number;
  dynamicPrimaryCount: number;
  qualityOnlyFallbackCount: number;
  lowConfidenceCount: number;
  sparseWarningCount: number;
};

let state: LeadMonetizationControlMonitoringSnapshot = {
  summariesBuilt: 0,
  dynamicPrimaryCount: 0,
  qualityOnlyFallbackCount: 0,
  lowConfidenceCount: 0,
  sparseWarningCount: 0,
};

export function getLeadMonetizationControlMonitoringSnapshot(): LeadMonetizationControlMonitoringSnapshot {
  return { ...state };
}

export function resetLeadMonetizationControlMonitoringForTests(): void {
  state = {
    summariesBuilt: 0,
    dynamicPrimaryCount: 0,
    qualityOnlyFallbackCount: 0,
    lowConfidenceCount: 0,
    sparseWarningCount: 0,
  };
}

export function recordLeadMonetizationControlSummary(meta: {
  mode: "dynamic_advisory" | "quality_advisory" | "base_only";
  confidence: "low" | "medium" | "high";
  sparseWarnings: number;
}): void {
  try {
    state.summariesBuilt += 1;
    if (meta.mode === "dynamic_advisory") state.dynamicPrimaryCount += 1;
    else if (meta.mode === "quality_advisory") state.qualityOnlyFallbackCount += 1;
    if (meta.confidence === "low") state.lowConfidenceCount += 1;
    if (meta.sparseWarnings > 0) state.sparseWarningCount += 1;
    console.info(`${LOG} summary built`, meta);
  } catch {
    /* noop */
  }
}
