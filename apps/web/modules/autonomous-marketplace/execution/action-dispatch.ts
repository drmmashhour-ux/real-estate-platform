import type { ExecutionResult } from "../types/domain.types";
import type { ProposedAction } from "../types/domain.types";
import { executeCampaignAction } from "./executors/campaign-action.executor";
import { executeLeadAction } from "./executors/lead-action.executor";
import { executeListingAction } from "./executors/listing-action.executor";
import { executeReviewTaskAction } from "./executors/review-task.executor";

/** Routes a proposed action to listing / lead / campaign / review executors (bounded side effects). */
export async function dispatchExecution(
  action: ProposedAction,
  opts: { dryRun: boolean; allowExecute: boolean },
): Promise<ExecutionResult> {
  if (action.target.type === "lead") {
    return executeLeadAction(action, opts);
  }
  if (action.target.type === "campaign") {
    return executeCampaignAction(action, opts);
  }
  if (action.type === "FLAG_REVIEW" || action.type === "REQUEST_HUMAN_APPROVAL") {
    return executeReviewTaskAction(action, opts);
  }
  return executeListingAction(action, opts);
}
