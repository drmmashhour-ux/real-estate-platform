/**
 * Lead pricing results measurement — advisory internal readouts only.
 * Prefix: [lead:pricing-results]
 */

const P = "[lead:pricing-results]";

function safeJson(v: unknown): string {
  try {
    return JSON.stringify(v);
  } catch {
    return '"[unserializable]"';
  }
}

export function monitorLeadPricingObservationCaptured(payload: {
  leadId: string;
  observationId: string;
  mode: string;
}): void {
  try {
    console.info(`${P} observation_captured ${safeJson(payload)}`);
  } catch {
    /* noop */
  }
}

export function monitorLeadPricingOutcomeEvaluated(payload: {
  leadId: string;
  observationId: string;
  outcomeBand: string;
}): void {
  try {
    console.info(`${P} outcome_evaluated ${safeJson(payload)}`);
  } catch {
    /* noop */
  }
}

export function monitorLeadPricingOutcomeBuckets(payload: Record<string, number>): void {
  try {
    console.info(`${P} outcome_buckets ${safeJson(payload)}`);
  } catch {
    /* noop */
  }
}

export function monitorLeadPricingModePerformanceBuilt(payload: { modes: number }): void {
  try {
    console.info(`${P} mode_performance_built ${safeJson(payload)}`);
  } catch {
    /* noop */
  }
}
