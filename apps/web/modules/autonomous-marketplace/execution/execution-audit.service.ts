import { prisma } from "@/lib/db";
import { engineFlags } from "@/config/feature-flags";

export type ExecutionAuditPhase = "attempt" | "decision" | "outcome" | "rollback";

/** Append-only audit — redacted identifiers only; never throws. */
export async function recordExecutionAttempt(input: {
  runId: string;
  actionId: string;
  actionType: string;
  actorUserId?: string | null;
}): Promise<{ ok: boolean }> {
  try {
    if (!engineFlags.controlledExecutionV1) return { ok: true };
    await prisma.autonomyExecutionAuditLog.create({
      data: {
        eventKind: "attempt",
        actorUserId: input.actorUserId ?? undefined,
        runId: input.runId,
        actionId: input.actionId,
        payloadJson: {
          phase: "attempt",
          timeline: "autonomy_action_attempted",
          actionType: input.actionType,
        },
      },
    });
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export async function recordExecutionDecision(input: {
  runId: string;
  actionId: string;
  dispositionSummary: string;
  gateAllowed: boolean;
  actorUserId?: string | null;
}): Promise<{ ok: boolean }> {
  try {
    if (!engineFlags.controlledExecutionV1) return { ok: true };
    await prisma.autonomyExecutionAuditLog.create({
      data: {
        eventKind: "decision",
        actorUserId: input.actorUserId ?? undefined,
        runId: input.runId,
        actionId: input.actionId,
        payloadJson: {
          phase: "decision",
          timeline: input.gateAllowed ? "autonomy_action_allowed" : "autonomy_action_blocked",
          dispositionSummary: input.dispositionSummary,
          gateAllowed: input.gateAllowed,
        },
      },
    });
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export async function recordExecutionOutcome(input: {
  runId: string;
  actionId: string;
  executionStatus: string;
  actorUserId?: string | null;
}): Promise<{ ok: boolean }> {
  try {
    if (!engineFlags.controlledExecutionV1) return { ok: true };
    await prisma.autonomyExecutionAuditLog.create({
      data: {
        eventKind: "outcome",
        actorUserId: input.actorUserId ?? undefined,
        runId: input.runId,
        actionId: input.actionId,
        payloadJson: {
          phase: "outcome",
          timeline:
            input.executionStatus === "EXECUTED"
              ? "autonomy_action_executed"
              : input.executionStatus === "REQUIRES_APPROVAL"
                ? "autonomy_action_pending_approval"
                : input.executionStatus === "FAILED"
                  ? "autonomy_action_failed"
                  : "autonomy_action_outcome",
          executionStatus: input.executionStatus,
        },
      },
    });
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export async function recordRollbackOutcome(input: {
  runId: string;
  actionId: string;
  reversible: boolean;
  notes?: string;
  actorUserId?: string | null;
}): Promise<{ ok: boolean }> {
  try {
    if (!engineFlags.autopilotHardeningV1 && !engineFlags.autonomyRollbackV1) return { ok: true };
    await prisma.autonomyExecutionAuditLog.create({
      data: {
        eventKind: "rollback",
        actorUserId: input.actorUserId ?? undefined,
        runId: input.runId,
        actionId: input.actionId,
        payloadJson: {
          phase: "rollback",
          timeline: "autonomy_action_rolled_back",
          reversible: input.reversible,
          notes: input.notes,
        },
      },
    });
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

/** Human approval resolution — append-only; correlates with pending approval rows. Never throws. */
export async function recordExecutionApproval(input: {
  runId: string | null;
  actionId: string;
  approvalId: string;
  resolution: "approved" | "rejected";
  actorUserId?: string | null;
}): Promise<{ ok: boolean }> {
  try {
    if (!engineFlags.autonomyApprovalsV1) return { ok: true };
    await prisma.autonomyExecutionAuditLog.create({
      data: {
        eventKind: "approval",
        actorUserId: input.actorUserId ?? undefined,
        runId: input.runId ?? undefined,
        actionId: input.actionId,
        payloadJson: {
          phase: "approval",
          timeline:
            input.resolution === "approved" ? "autonomy_action_pending_approval_resolved" : "autonomy_action_rejected",
          approvalId: input.approvalId,
          resolution: input.resolution,
        },
      },
    });
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
