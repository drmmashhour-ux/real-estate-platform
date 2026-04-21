import { prisma } from "@/lib/db";
import type { AutonomousActionCandidate } from "@/modules/autonomy/autonomy.types";
import { autonomyLog } from "@/modules/autonomy/autonomy-log";
import { dispatchSafeExecution } from "@/modules/autonomy/execution-dispatcher";

export async function approveAutonomousAction(
  actionQueueId: string,
  userId: string,
  reason?: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const q = await prisma.autonomousActionQueue.findUnique({ where: { id: actionQueueId } });
    if (!q || q.status !== "QUEUED") {
      return { ok: false, error: "invalid_state" };
    }
    await prisma.autonomousApprovalEvent.create({
      data: {
        actionQueueId,
        decision: "APPROVED",
        decidedByUserId: userId,
        reason: reason ?? null,
      },
    });
    await prisma.autonomousActionQueue.update({
      where: { id: actionQueueId },
      data: { status: "APPROVED", approvedAt: new Date() },
    });
    autonomyLog.approvalRecorded({ actionQueueId, decision: "APPROVED", userId });
    return { ok: true };
  } catch {
    return { ok: false, error: "approve_failed" };
  }
}

export async function rejectAutonomousAction(
  actionQueueId: string,
  userId: string,
  reason?: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const q = await prisma.autonomousActionQueue.findUnique({ where: { id: actionQueueId } });
    if (!q || q.status !== "QUEUED") {
      return { ok: false, error: "invalid_state" };
    }
    await prisma.autonomousApprovalEvent.create({
      data: {
        actionQueueId,
        decision: "REJECTED",
        decidedByUserId: userId,
        reason: reason ?? null,
      },
    });
    await prisma.autonomousActionQueue.update({
      where: { id: actionQueueId },
      data: { status: "REJECTED", rejectedAt: new Date() },
    });
    autonomyLog.approvalRecorded({ actionQueueId, decision: "REJECTED", userId });
    return { ok: true };
  } catch {
    return { ok: false, error: "reject_failed" };
  }
}

export async function executeApprovedAction(actionQueueId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const q = await prisma.autonomousActionQueue.findUnique({ where: { id: actionQueueId } });
    if (!q || q.status !== "APPROVED") {
      return { ok: false, error: "invalid_state" };
    }
    const candidate = q.candidateJson as unknown as AutonomousActionCandidate;
    const exec = await dispatchSafeExecution(candidate);
    await prisma.autonomousExecutionEvent.create({
      data: {
        actionQueueId,
        executionStatus: exec.ok ? "SUCCESS" : "FAILED",
        resultJson: exec as unknown as object,
      },
    });
    await prisma.autonomousActionQueue.update({
      where: { id: actionQueueId },
      data: {
        status: exec.ok ? "EXECUTED" : "BLOCKED",
        executedAt: new Date(),
      },
    });
    autonomyLog.actionExecuted({ actionQueueId, phase: "post_approval", ok: exec.ok });
    return { ok: exec.ok, error: exec.ok ? undefined : "execution_failed" };
  } catch {
    return { ok: false, error: "execute_failed" };
  }
}
