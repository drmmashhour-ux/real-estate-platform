import type { WhatIfResult } from "@/modules/simulation/simulation.types";

import type { NormalizedSimulationOutput } from "./scenario-autopilot.types";

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

/**
 * Map what-if output into comparable autopilot metrics (still simulated until execution).
 */
export function normalizeSimulationOutput(result: WhatIfResult): NormalizedSimulationOutput {
  const p = result.predictedMetrics;
  const s = result.scenario;
  const noShowProxy =
    -s.responseSpeedChange * 6 - Math.max(0, s.marketingBoost - 0.4) * 2 + s.autopilotLevel * 0.4;
  const complexity = clamp01(
    Math.abs(s.marketingBoost) * 0.4 + (s.autopilotLevel / 3) * 0.3 + Math.abs(s.pricingAdjustment) * 1.2,
  );
  return {
    revenueDelta: p.revenueChangePct,
    conversionDelta: p.conversionChangePts,
    disputeRiskDelta: p.disputeRiskChangePts,
    trustImpact: p.trustChangePts,
    noShowImpact: Math.round(noShowProxy * 10) / 10,
    workloadImpact: p.workloadChangePct,
    operationalComplexity: Math.round(complexity * 100) / 100,
  };
}
