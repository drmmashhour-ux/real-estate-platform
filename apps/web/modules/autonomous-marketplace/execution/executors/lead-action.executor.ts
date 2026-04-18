import type { ExecutionResult } from "../../types/domain.types";
import type { ProposedAction } from "../../types/domain.types";
import { buildDryRunResult } from "./dry-run-result";

export type LeadExecutorOptions = {
  dryRun: boolean;
  allowExecute: boolean;
};

function wouldExecuteLeadMessage(action: ProposedAction): string {
  if (!action.target.id) {
    return `Would execute ${action.type} — lead id missing (no target)`;
  }
  return `Would execute ${action.type} for lead ${action.target.id}`;
}

/**
 * Lead-side autonomous actions — **DRY_RUN only** (no DB mutations in this phase).
 */
export class LeadActionExecutor {
  execute(action: ProposedAction, _opts: LeadExecutorOptions): Promise<ExecutionResult> {
    void _opts;
    const message = wouldExecuteLeadMessage(action);
    return Promise.resolve(
      buildDryRunResult(message, {
        actionType: action.type,
        leadId: action.target.id,
        executor: "LeadActionExecutor",
      }),
    );
  }
}

export const leadActionExecutor = new LeadActionExecutor();

export async function executeLeadAction(
  action: ProposedAction,
  opts: LeadExecutorOptions,
): Promise<ExecutionResult> {
  return leadActionExecutor.execute(action, opts);
}
