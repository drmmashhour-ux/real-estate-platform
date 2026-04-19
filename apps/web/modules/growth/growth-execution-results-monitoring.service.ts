/**
 * Log prefix: [growth:execution-results]
 */

import type { OutcomeBand } from "@/modules/growth/growth-execution-results.types";

const P = "[growth:execution-results]";

function safeJson(v: unknown): string {
  try {
    return JSON.stringify(v);
  } catch {
    return '"[unserializable]"';
  }
}

export function monitorGrowthExecutionResultsSummary(payload: {
  windowDays: number;
  bandAgg: Record<string, Record<OutcomeBand, number>>;
  sparseAi: boolean;
  sparseBrokerUniform: boolean;
}): void {
  try {
    console.info(`${P} summary_built ${safeJson(payload)}`);
  } catch {
    /* noop */
  }
}
