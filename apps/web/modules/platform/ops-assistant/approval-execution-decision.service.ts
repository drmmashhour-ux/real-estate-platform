/**
 * Conservative decision labels — informational only; never enables new scope.
 */

import type {
  ApprovalExecutionDecision,
  ApprovalExecutionSafetyScore,
  ApprovalExecutionUsefulnessScore,
} from "./approval-execution-results.types";

export type ApprovalDecisionInput = {
  insufficientData: boolean;
  safety: ApprovalExecutionSafetyScore;
  usefulness: ApprovalExecutionUsefulnessScore;
  undoRate: number;
  failureRate: number;
  executionCount: number;
};

export function decideApprovalExecutionOutcome(input: ApprovalDecisionInput): {
  decision: ApprovalExecutionDecision;
  explanation: string;
} {
  if (input.insufficientData) {
    return {
      decision: "insufficient_data",
      explanation:
        "Sample size is too small for a reliability verdict. Continue collecting approval/execution history before drawing conclusions.",
    };
  }

  if (input.usefulness === "insufficient_data") {
    return {
      decision: "insufficient_data",
      explanation:
        "Requests exist but execution outcomes are too thin to judge usefulness — wait for more completed runs.",
    };
  }

  if (input.safety === "unsafe") {
    return {
      decision: "rollback_candidate",
      explanation:
        "Safety signals (failures, undos, audit gaps, or blocks) exceed conservative thresholds. Treat current execution scope as suspect until reviewed.",
    };
  }

  if (input.undoRate > 0.35 && input.executionCount >= 3) {
    return {
      decision: "rollback_candidate",
      explanation:
        "High undo rate suggests operators reverse outcomes often — pause confidence in expanding anything until causes are reviewed.",
    };
  }

  if (input.safety === "caution" || input.usefulness === "weak" || input.usefulness === "poor") {
    return {
      decision: "hold",
      explanation:
        "Mixed or weak usefulness, or caution-level safety. Keep the current tiny allowlist; improve guidance and watch the next window.",
    };
  }

  if (
    input.safety === "safe" &&
    (input.usefulness === "strong" || input.usefulness === "good") &&
    input.undoRate < 0.15 &&
    input.failureRate < 0.15 &&
    input.executionCount >= 3
  ) {
    return {
      decision: "eligible_for_future_review",
      explanation:
        "Signals are healthy enough to schedule a human review of whether scope could be discussed later. This label does not enable new actions or autonomy.",
    };
  }

  return {
    decision: "keep_current_scope",
    explanation:
      "No strong signal to change posture — maintain the current minimal allowlist and continue measuring.",
  };
}
