/**
 * [revenue-forecast] — best-effort, never throws.
 */

const P = "[revenue-forecast]";

export function logRevenueForecastBuilt(params: {
  windowDays: number;
  sufficient: boolean;
  confidence: string;
}): void {
  try {
    console.info(
      `${P} forecast window=${params.windowDays} sufficient=${params.sufficient} conf=${params.confidence}`,
    );
  } catch {
    /* ignore */
  }
}

export function logRevenueForecastLowConfidence(reason: string): void {
  try {
    console.info(`${P} low-confidence ${reason}`);
  } catch {
    /* ignore */
  }
}
