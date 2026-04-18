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
    if (!engineFlags.autopilotHardeningV1) return { ok: true };
    await prisma.autonomyExecutionAuditLog.create({
      data: {
        eventKind: "rollback",
        actorUserId: input.actorUserId ?? undefined,
        runId: input.runId,
        actionId: input.actionId,
        payloadJson: {
          phase: "rollback",
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
