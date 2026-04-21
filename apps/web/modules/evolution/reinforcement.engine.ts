import {
  REINFORCEMENT_SCORE_MAX,
  REINFORCEMENT_SCORE_MIN,
  REINFORCEMENT_STEP_CAP,
  type EvolutionDomain,
} from "./evolution.types";
import type { FeedbackAssessment } from "./evolution.types";
import { logEvolution } from "./evolution-logger";

export type ReinforcementInput = {
  domain: EvolutionDomain;
  strategyKey: string;
  /** From compareExpectedVsActual or business rules. */
  assessment: FeedbackAssessment;
  /** Optional extra weight for high-signal events (capped). */
  signalWeight?: number;
};

/**
 * Compute next bounded reinforcement score (not persisted here).
 * Callers must write through `applyReinforcementToMemory` for storage.
 */
export function computeNextReinforcementScore(
  current: number,
  input: ReinforcementInput
): { next: number; delta: number; label: "PROMOTE" | "DEMOTE" | "HOLD" } {
  const w = Math.min(1.5, Math.max(0.5, input.signalWeight ?? 1));
  const step = REINFORCEMENT_STEP_CAP * w;
  let delta = 0;
  if (input.assessment === "BETTER_THAN_EXPECTED") {
    delta = step;
  } else if (input.assessment === "WORSE_THAN_EXPECTED") {
    delta = -step;
  } else {
    return { next: clamp(current), delta: 0, label: "HOLD" };
  }
  const next = clamp(current + delta);
  const label: "PROMOTE" | "DEMOTE" | "HOLD" = delta > 0 ? "PROMOTE" : delta < 0 ? "DEMOTE" : "HOLD";
  logEvolution("adjustment", {
    kind: "reinforcement_step",
    domain: input.domain,
    strategyKey: input.strategyKey,
    from: current,
    to: next,
    label,
  });
  return { next, delta, label };
}

function clamp(n: number): number {
  if (n < REINFORCEMENT_SCORE_MIN) return REINFORCEMENT_SCORE_MIN;
  if (n > REINFORCEMENT_SCORE_MAX) return REINFORCEMENT_SCORE_MAX;
  return n;
}

/**
 * Map assessment to success / failure counts (for memory rollups).
 */
export function bucketOutcome(assessment: FeedbackAssessment): { success: 0 | 1; failure: 0 | 1 } {
  if (assessment === "BETTER_THAN_EXPECTED" || assessment === "ON_TARGET") return { success: 1, failure: 0 };
  if (assessment === "WORSE_THAN_EXPECTED") return { success: 0, failure: 1 };
  return { success: 0, failure: 0 };
}
