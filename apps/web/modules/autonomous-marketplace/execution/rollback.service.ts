import { recordRollbackOutcome } from "./execution-audit.service";
import type { ProposedAction } from "../types/domain.types";
import type { ExecutionResult } from "../types/domain.types";
import { isControlledSafeActionType } from "./action-application.service";

export type RollbackControlledActionParams = {
  runId: string;
  proposed: ProposedAction;
  execution: ExecutionResult;
  actorUserId?: string | null;
};

/** Reversible internal actions only; otherwise audit marks non-reversible. Never throws. */
export async function rollbackControlledAction(
  params: RollbackControlledActionParams,
): Promise<{ ok: boolean; reversible: boolean }> {
  const reversible =
    isControlledSafeActionType(params.proposed.type) &&
    params.execution.status === "EXECUTED";

  await recordRollbackOutcome({
    runId: params.runId,
    actionId: params.proposed.id,
    reversible,
    notes: reversible ? "rollback_requested" : "non_reversible_or_simulated",
    actorUserId: params.actorUserId,
  });

  return { ok: true, reversible };
}

export async function rollbackControlledBatch(
  items: RollbackControlledActionParams[],
): Promise<{ processed: number }> {
  let processed = 0;
  for (const i of items) {
    const r = await rollbackControlledAction(i);
    if (r.ok) processed += 1;
  }
  return { processed };
}
