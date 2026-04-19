/**
 * Conservative safety readout from aggregates — never throws.
 */

import type { ApprovalExecutionSafetyScore } from "./approval-execution-results.types";

export type ApprovalSafetyInput = {
  totalRequests: number;
  executionCount: number;
  undoCount: number;
  failureCount: number;
  blockedBySafetyCount: number;
  undoRate: number;
  failureRate: number;
  /** Share of requests missing a matching audit trail signal (0–1). */
  auditTrailGapRatio: number;
  /** True if any request used a non-allowlisted action type (should never happen). */
  allowlistViolation: boolean;
};

export function evaluateApprovalSafety(input: ApprovalSafetyInput): {
  score: ApprovalExecutionSafetyScore;
  reasons: string[];
} {
  const reasons: string[] = [];

  if (input.allowlistViolation) {
    reasons.push("Non-allowlisted action type detected in stored requests.");
    return { score: "unsafe", reasons };
  }

  if (input.auditTrailGapRatio > 0.35 && input.totalRequests >= 5) {
    reasons.push("Large gap between stored requests and audit trail completeness.");
    return { score: "unsafe", reasons };
  }

  if (input.blockedBySafetyCount > 0 && input.totalRequests > 0) {
    const blockRate = input.blockedBySafetyCount / input.totalRequests;
    if (blockRate > 0.25) {
      reasons.push("High blocked-by-safety rate relative to intake.");
      return { score: "unsafe", reasons };
    }
    reasons.push("Some operations blocked by safety gates.");
  }

  if (input.executionCount >= 3 && input.undoRate > 0.35) {
    reasons.push("Undo rate is high relative to executions.");
    return { score: "unsafe", reasons };
  }

  if (input.executionCount >= 3 && input.failureRate > 0.3) {
    reasons.push("Failure rate is elevated.");
    return { score: "unsafe", reasons };
  }

  if (input.undoRate > 0.2 || input.failureRate > 0.15) {
    reasons.push("Elevated undo or failure signals — monitor closely.");
    return { score: "caution", reasons };
  }

  if (input.totalRequests < 5) {
    reasons.push("Low sample — safety band is provisional.");
    return { score: "caution", reasons };
  }

  reasons.push("No critical safety signals in current window.");
  return { score: "safe", reasons };
}
