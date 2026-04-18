import type { ActionType } from "../types/domain.types";
import type { ExecutionResult } from "../types/domain.types";
import type { ProposedAction } from "../types/domain.types";
import type {
  ControlledActionApplicationResult,
  ControlledExecutionBatchResult,
  ControlledExecutionRecord,
} from "./controlled-execution.types";
import { dispatchExecution } from "./action-dispatch";
import type { SafeExecutionGateOutput } from "./safe-execution-gate.service";

/**
 * Only these may use a non-dry-run path when the safe-execution gate allows live execution
 * (`FEATURE_CONTROLLED_EXECUTION_V1`). All other action types — including price, messaging,
 * promotions, campaigns, and `REQUEST_HUMAN_APPROVAL` — stay simulation-only here.
 */
const SAFE_INTERNAL_TYPES = new Set<ActionType>(["CREATE_TASK", "FLAG_REVIEW"]);

export function isControlledSafeActionType(actionType: ActionType): boolean {
  return SAFE_INTERNAL_TYPES.has(actionType);
}

function buildRecord(
  status: ControlledExecutionRecord["status"],
  reasons: ControlledExecutionRecord["reasons"],
  requiresApproval: boolean,
  gateAllowedLive: boolean,
): ControlledExecutionRecord {
  return { status, reasons, requiresApproval, gateAllowedLive };
}

function mapExecutionToRecord(
  gate: SafeExecutionGateOutput,
  execution: ExecutionResult,
): ControlledExecutionRecord {
  const reasons = [...gate.reasons];
  if (execution.status === "EXECUTED") {
    if (!reasons.includes("execution_success")) reasons.push("execution_success");
    return buildRecord("executed", reasons, gate.requiresApproval, gate.allowed);
  }
  if (execution.status === "FAILED") {
    reasons.push("execution_failure");
    return buildRecord("failed", reasons, gate.requiresApproval, false);
  }
  if (execution.status === "DRY_RUN") {
    return buildRecord("dry_run", reasons, gate.requiresApproval, false);
  }
  if (execution.status === "REQUIRES_APPROVAL") {
    return buildRecord("pending_approval", reasons, true, false);
  }
  return buildRecord("skipped", reasons, gate.requiresApproval, false);
}

export type ApplyControlledActionParams = {
  proposed: ProposedAction;
  gate: SafeExecutionGateOutput;
};

/**
 * Applies one action through the dispatcher with dry-run vs live derived from gate + safe list.
 * Never throws; surfaces errors in {@link ControlledActionApplicationResult.errorMessage}.
 */
export async function applyControlledAction(params: ApplyControlledActionParams): Promise<ControlledActionApplicationResult> {
  const { proposed, gate } = params;

  try {
    if (!isControlledSafeActionType(proposed.type)) {
      const execution = await dispatchExecution(proposed, {
        dryRun: true,
        allowExecute: false,
      });
      return {
        ok: true,
        record: buildRecord("skipped", [...gate.reasons, "config_disabled"], false, false),
        executionResult: execution,
      };
    }

    const live = gate.allowed;
    const execution = await dispatchExecution(proposed, {
      dryRun: !live,
      allowExecute: live,
    });

    const record = mapExecutionToRecord(gate, execution);
    return {
      ok: execution.status !== "FAILED",
      record,
      executionResult: execution,
      errorMessage: execution.status === "FAILED" ? execution.detail : undefined,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      ok: false,
      record: buildRecord("failed", [...gate.reasons, "execution_failure"], gate.requiresApproval, false),
      errorMessage: msg,
    };
  }
}

export type ApplyControlledActionBatchParams = {
  items: ApplyControlledActionParams[];
};

export async function applyControlledActionBatch(
  params: ApplyControlledActionBatchParams,
): Promise<ControlledExecutionBatchResult> {
  const results: ControlledActionApplicationResult[] = [];
  const errors: string[] = [];

  for (const item of params.items) {
    const r = await applyControlledAction(item);
    results.push(r);
    if (!r.ok && r.errorMessage) errors.push(r.errorMessage);
  }

  return { results, errors };
}
