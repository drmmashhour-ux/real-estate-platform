/**
 * Log prefix: [weekly-review]
 */

const P = "[weekly-review]";

function safeJson(v: unknown): string {
  try {
    return JSON.stringify(v);
  } catch {
    return '"[unserializable]"';
  }
}

export function monitorWeeklyReviewBuilt(payload: {
  windowDays: number;
  sparse: boolean;
  confidence: string;
}): void {
  try {
    console.info(`${P} summary_built ${safeJson(payload)}`);
  } catch {
    /* noop */
  }
}
