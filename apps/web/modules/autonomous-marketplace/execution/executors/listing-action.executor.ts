import type { ExecutionResult } from "../../types/domain.types";
import type { ProposedAction } from "../../types/domain.types";
import { buildDryRunResult } from "./dry-run-result";

export type ListingExecutorOptions = {
  dryRun: boolean;
  allowExecute: boolean;
};

function wouldExecuteListingMessage(action: ProposedAction): string {
  const listingId = action.target.id ?? "(unknown listing)";
  return `Would execute ${action.type} for FSBO listing ${listingId}`;
}

/**
 * Listing-side autonomous actions — **DRY_RUN only** (no DB mutations in this phase).
 */
export class ListingActionExecutor {
  execute(action: ProposedAction, _opts: ListingExecutorOptions): Promise<ExecutionResult> {
    void _opts;
    const message = wouldExecuteListingMessage(action);
    return Promise.resolve(
      buildDryRunResult(message, {
        actionType: action.type,
        listingId: action.target.id,
        executor: "ListingActionExecutor",
      }),
    );
  }
}

export const listingActionExecutor = new ListingActionExecutor();

export async function executeListingAction(
  action: ProposedAction,
  opts: ListingExecutorOptions,
): Promise<ExecutionResult> {
  return listingActionExecutor.execute(action, opts);
}
