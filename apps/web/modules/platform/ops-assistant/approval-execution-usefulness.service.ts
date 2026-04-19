/**
 * Usefulness bands from usage signals — not a product score; evidence only.
 */

import type { ApprovalExecutionUsefulnessScore } from "./approval-execution-results.types";

export type ApprovalUsefulnessInput = {
  totalRequests: number;
  executionCount: number;
  executedSuccessCount: number;
  failureCount: number;
  undoCount: number;
  approvalCount: number;
  executionSuccessRate: number;
  undoRate: number;
};

export function evaluateApprovalUsefulness(input: ApprovalUsefulnessInput): {
  score: ApprovalExecutionUsefulnessScore;
  reasons: string[];
} {
  const reasons: string[] = [];

  if (input.totalRequests < 5 || input.executionCount === 0) {
    reasons.push("Not enough usage to judge usefulness.");
    return { score: "insufficient_data", reasons };
  }

  if (input.executionCount >= 3 && input.undoRate > 0.35) {
    reasons.push("Frequent undos suggest mismatch with operator intent.");
    return { score: "poor", reasons };
  }

  if (input.executionSuccessRate < 0.55 && input.executionCount >= 3) {
    reasons.push("Execution failures dominate outcomes.");
    return { score: "poor", reasons };
  }

  if (input.executionSuccessRate >= 0.85 && input.undoRate < 0.1 && input.executionCount >= 3) {
    reasons.push("High success and low undo — operators appear to keep outcomes.");
    return { score: "strong", reasons };
  }

  if (input.executionSuccessRate >= 0.7 && input.undoRate < 0.2) {
    reasons.push("Generally healthy execution retention.");
    return { score: "good", reasons };
  }

  reasons.push("Mixed signals — worth watching.");
  return { score: "weak", reasons };
}
