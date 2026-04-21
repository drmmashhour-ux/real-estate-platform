import type { FeedbackAssessment } from "./evolution.types";

export type FeedbackComparisonInput = {
  /** Numeric expectation when available (e.g. predicted conversion rate). */
  expected?: number | null;
  /** Observed numeric outcome in same units as expected when possible. */
  actual?: number | null;
  /** Fallback qualitative expectation label. */
  expectedLabel?: string | null;
  /** Fallback qualitative observed label. */
  actualLabel?: string | null;
};

export type FeedbackComparisonResult = {
  varianceScore: number | null;
  /** Normalized surprise in [-1, 1] when numerics exist; null otherwise. */
  normalizedSignal: number | null;
  assessment: FeedbackAssessment;
  explanation: string;
};

/**
 * Compare expected vs actual — deterministic, conservative when data is thin.
 */
export function compareExpectedVsActual(input: FeedbackComparisonInput): FeedbackComparisonResult {
  const { expected, actual } = input;

  if (typeof expected === "number" && typeof actual === "number" && Number.isFinite(expected) && Number.isFinite(actual)) {
    const denom = Math.max(Math.abs(expected), 1e-6);
    const raw = (actual - expected) / denom;
    const normalizedSignal = Math.max(-1, Math.min(1, raw));
    const varianceScore = actual - expected;

    let assessment: FeedbackAssessment = "ON_TARGET";
    if (normalizedSignal > 0.08) assessment = "BETTER_THAN_EXPECTED";
    else if (normalizedSignal < -0.08) assessment = "WORSE_THAN_EXPECTED";

    return {
      varianceScore,
      normalizedSignal,
      assessment,
      explanation:
        assessment === "ON_TARGET" ?
          "Outcome within tolerance vs expectation."
        : assessment === "BETTER_THAN_EXPECTED" ?
          "Outcome materially above expectation — reinforce supporting strategy cautiously."
        : "Outcome materially below expectation — damp strategy weight or investigate guardrails.",
    };
  }

  if (input.expectedLabel && input.actualLabel) {
    const match = input.expectedLabel.trim().toLowerCase() === input.actualLabel.trim().toLowerCase();
    return {
      varianceScore: null,
        normalizedSignal: null,
        assessment: match ? "ON_TARGET" : "INSUFFICIENT_DATA",
        explanation: match ?
          "Qualitative labels align; no numeric feedback."
        : "Qualitative labels differ or sparse data — log for review, do not over-interpret.",
    };
  }

  return {
    varianceScore: null,
    normalizedSignal: null,
    assessment: "INSUFFICIENT_DATA",
    explanation: "Not enough structured expected/actual data to score this outcome.",
  };
}
