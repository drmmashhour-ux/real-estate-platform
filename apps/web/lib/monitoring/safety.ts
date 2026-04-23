/**
 * Product and compliance guards — monitoring is inform-only (no auto-offers or purchases).
 */

const GUARANTEED_OUTCOME_RE = /guarantee(d)?\s+(return|profit|outcome)|best\s+investment|sure\s+thing|can't\s+lose|cannot\s+lose|risk-?free\s+return/i;

export function assertNoGuaranteedOutcomeLanguage(...parts: string[]): void {
  const text = parts.filter(Boolean).join(" ");
  if (GUARANTEED_OUTCOME_RE.test(text)) {
    throw new Error("GUARANTEED_OUTCOME_LANGUAGE_FORBIDDEN");
  }
}

/** Saved-search runs require an explicit data-layer flag (avoid “headless” runs with no governed source). */
export function assertMonitoringDataLayerEnabled(): void {
  if (process.env.LECIPM_MONITORING_DATA_LAYER !== "true") {
    throw new Error("DATA_SOURCE_REQUIRED");
  }
}

export function assertNoAutoActionWithoutHumanReview(metadata?: Record<string, unknown> | null): void {
  if (metadata && metadata.autoAction === true) {
    throw new Error("HUMAN_REVIEW_REQUIRED");
  }
}
