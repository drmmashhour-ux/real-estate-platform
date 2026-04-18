import type { ExecutionResult } from "../../types/domain.types";
import type { ProposedAction } from "../../types/domain.types";
import { executeListingAction } from "./listing-action.executor";

/**
 * Review / escalation actions reuse listing paths when FSBO-targeted.
 */
export async function executeReviewTaskAction(
  action: ProposedAction,
  opts: { dryRun: boolean; allowExecute: boolean },
): Promise<ExecutionResult> {
  if (action.target.type === "fsbo_listing") {
    return executeListingAction(action, opts);
  }

  const startedAt = new Date().toISOString();
  return {
    status: opts.dryRun || !opts.allowExecute ? "DRY_RUN" : "EXECUTED",
    startedAt,
    finishedAt: new Date().toISOString(),
    detail: "Review routing recorded without additional persistence.",
    metadata: { targetType: action.target.type },
  };
}
