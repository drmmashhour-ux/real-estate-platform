import type { Deal } from "@prisma/client";
import { canMutateExecution } from "@/lib/deals/execution-access";
import { assertBrokerApprovalExecutionGate } from "@/modules/approval/broker-approval-workflow.service";
import { canTransition, normalizeState } from "./execution-state-machine";
import type { ExecutionPipelineState } from "./execution.types";

export type ExecutionGuardContext = {
  deal: Pick<Deal, "id" | "brokerId" | "lecipmExecutionPipelineState">;
  userId: string;
  role: string | null | undefined;
};

export function assertBrokerForApproval(ctx: ExecutionGuardContext): { ok: true } | { ok: false; message: string } {
  if (!canMutateExecution(ctx.userId, ctx.role, ctx.deal)) {
    return { ok: false, message: "Only the assigned broker or admin can approve execution." };
  }
  return { ok: true };
}

/** Execution / signature prep — broker or admin only. */
export function assertBrokerForExecution(ctx: ExecutionGuardContext): { ok: true } | { ok: false; message: string } {
  return assertBrokerForApproval(ctx);
}

export async function assertHasBrokerApproval(dealId: string): Promise<{ ok: true } | { ok: false; message: string }> {
  return assertBrokerApprovalExecutionGate(dealId);
}

export function assertTransitionAllowed(
  from: ExecutionPipelineState | null | undefined,
  to: ExecutionPipelineState,
): { ok: true } | { ok: false; message: string } {
  if (!canTransition(from, to)) {
    return {
      ok: false,
      message: `Invalid pipeline transition: ${normalizeState(from)} → ${to}`,
    };
  }
  return { ok: true };
}

/** Closing requires signatures complete + conditions not blocking (caller passes result). */
export function assertClosingPreconditions(input: {
  state: ExecutionPipelineState | null | undefined;
  allConditionsFulfilled: boolean;
  signatureComplete: boolean;
}): { ok: true } | { ok: false; message: string } {
  const s = normalizeState(input.state);
  if (!input.signatureComplete && (s === "closing_ready" || s === "closed")) {
    return { ok: false, message: "Cannot mark closing while signature is incomplete." };
  }
  if (!input.allConditionsFulfilled && s === "closing_ready") {
    return { ok: false, message: "Outstanding conditions — broker review required." };
  }
  return { ok: true };
}
