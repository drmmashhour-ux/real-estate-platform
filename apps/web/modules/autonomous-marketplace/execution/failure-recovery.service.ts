import type { ExecutionResult } from "../types/domain.types";

export type FailureClassification =
  | "transient_simulation"
  | "executor_failed"
  | "policy_expected_block"
  | "unknown";

export function classifyExecutionFailure(execution: ExecutionResult): FailureClassification {
  if (execution.status === "FAILED") return "executor_failed";
  if (execution.status === "DRY_RUN") return "transient_simulation";
  if (execution.status === "BLOCKED") return "policy_expected_block";
  return "unknown";
}

export type RecoveryRecommendation =
  | "manual_followup"
  | "retry_dry_run"
  | "no_action";

export function recommendRecoveryPath(execution: ExecutionResult): RecoveryRecommendation {
  const c = classifyExecutionFailure(execution);
  if (c === "executor_failed") return "manual_followup";
  if (c === "transient_simulation") return "retry_dry_run";
  return "no_action";
}

export function markActionForRetry(_actionId: string): { marked: boolean } {
  return { marked: false };
}

export function markActionForManualFollowup(_actionId: string): { marked: boolean } {
  return { marked: true };
}
