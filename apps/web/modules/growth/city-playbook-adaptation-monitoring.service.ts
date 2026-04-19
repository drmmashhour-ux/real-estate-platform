/**
 * Prefix: [fast-deal:adaptation]
 */

const P = "[fast-deal:adaptation]";

function safeJson(v: unknown): string {
  try {
    return JSON.stringify(v);
  } catch {
    return '"[unserializable]"';
  }
}

export function monitorAdaptationBundle(payload: {
  adaptationsGenerated: number;
  lowConfidenceAdaptations: number;
  skippedThinData: number;
}): void {
  try {
    console.info(`${P} bundle_built ${safeJson(payload)}`);
  } catch {
    /* noop */
  }
}
