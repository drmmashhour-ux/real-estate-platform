/**
 * [growth:policy-trends] — never throws.
 */

const P = "[growth:policy-trends]";

export function logGrowthPolicyTrendSummaryBuilt(params: {
  windowDays: number;
  confidence: string;
  insufficient: boolean;
  overall: string;
}): void {
  try {
    console.info(
      `${P} summary window=${params.windowDays} conf=${params.confidence} insufficient=${params.insufficient} overall=${params.overall}`,
    );
  } catch {
    /* ignore */
  }
}

export function logGrowthPolicyTrendLowConfidence(params: { reason: string }): void {
  try {
    console.info(`${P} low_confidence ${params.reason}`);
  } catch {
    /* ignore */
  }
}
