/**
 * [growth:policy-history] — never throws.
 */

const P = "[growth:policy-history]";

export function logGrowthPolicyHistoryUpdate(params: { fingerprintCount: number; ticked: number }): void {
  try {
    console.info(`${P} eval_update fps=${params.fingerprintCount} ticked=${params.ticked}`);
  } catch {
    /* ignore */
  }
}

export function logGrowthPolicyReviewCreated(params: {
  fingerprint: string;
  decision: string;
}): void {
  try {
    console.info(`${P} review fingerprint=${params.fingerprint} decision=${params.decision}`);
  } catch {
    /* ignore */
  }
}

export function logGrowthPolicyRecurringDetected(params: { fingerprint: string; seenCount: number }): void {
  try {
    console.info(`${P} recurring fingerprint=${params.fingerprint} seen=${params.seenCount}`);
  } catch {
    /* ignore */
  }
}

export function logGrowthPolicyHistorySummaryBuilt(params: {
  total: number;
  recurring: number;
  resolvedReviewed: number;
}): void {
  try {
    console.info(
      `${P} summary total=${params.total} recurring=${params.recurring} resolved_reviewed=${params.resolvedReviewed}`,
    );
  } catch {
    /* ignore */
  }
}
