/**
 * Log prefix: [market-expansion]
 */

const P = "[market-expansion]";

function safeJson(v: unknown): string {
  try {
    return JSON.stringify(v);
  } catch {
    return '"[unserializable]"';
  }
}

export function monitorMarketExpansionBuilt(payload: {
  windowDays: number;
  candidateCount: number;
  lowConfidence: number;
  referenceSet: boolean;
}): void {
  try {
    console.info(`${P} recommendation_built ${safeJson(payload)}`);
  } catch {
    /* noop */
  }
}
