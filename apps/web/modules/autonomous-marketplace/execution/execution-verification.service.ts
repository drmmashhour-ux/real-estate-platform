import type { ExecutionResult } from "../types/domain.types";
import type { ProposedAction } from "../types/domain.types";

export type VerifyOutcomeInput = {
  proposed: ProposedAction;
  execution: ExecutionResult;
};

export type VerifyOutcomeResult = {
  verified: boolean;
  reversible: boolean;
  notes: string;
};

/** Deterministic verification — listing/lead executors are dry-run-only; EXECUTED paths are advisory. Never throws. */
export function verifyActionOutcome(input: VerifyOutcomeInput): VerifyOutcomeResult {
  const { execution } = input;
  if (execution.status === "DRY_RUN") {
    return {
      verified: true,
      reversible: true,
      notes: "dry_run_no_live_mutations_to_verify",
    };
  }
  if (execution.status === "EXECUTED") {
    const advisory = execution.metadata?.advisory === true || execution.metadata?.observabilityOnly === true;
    return {
      verified: advisory,
      reversible: advisory,
      notes: advisory ? "advisory_exec_recorded" : "exec_without_advisory_flag",
    };
  }
  return {
    verified: false,
    reversible: false,
    notes: `status_${execution.status}`,
  };
}

export function verifyBatchOutcome(
  items: VerifyOutcomeInput[],
): { results: VerifyOutcomeResult[] } {
  return {
    results: items.map((i) => verifyActionOutcome(i)),
  };
}
