/**
 * Prefix: [fast-deal:city]
 */

const P = "[fast-deal:city]";

function safeJson(v: unknown): string {
  try {
    return JSON.stringify(v);
  } catch {
    return '"[unserializable]"';
  }
}

export function monitorCityComparisonBuilt(payload: {
  cities: number;
  windowDays: number;
  lowConfidence: number;
}): void {
  try {
    console.info(`${P} comparison_built ${safeJson(payload)}`);
  } catch {
    /* noop */
  }
}
