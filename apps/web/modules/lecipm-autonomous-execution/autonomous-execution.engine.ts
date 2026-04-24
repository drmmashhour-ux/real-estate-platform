import type {
  LecipmAutonomousExecutionMode,
  LecipmExecutionRiskLevel,
  LecipmExecutionTask,
  LecipmExecutionTaskStatus,
} from "@prisma/client";
import { Prisma } from "@prisma/client";
import { prisma } from "@repo/db";

import { recordExecutionAudit } from "./execution-audit.service";
import { runExecutionConnector } from "./execution-connectors.service";
import { classifyExecutionRisk } from "./execution-risk-classifier";
import { assertSafeToAutoExecute, buildIdempotencyKey, noteExecutionFailureAndMaybePause } from "./execution-safety.service";
import type { BrokerExecutionSettingsView, QueueExecutionTaskInput } from "./execution.types";

export async function getOrCreateBrokerExecutionSettings(brokerUserId: string) {
  return prisma.brokerLecipmExecutionSettings.upsert({
    where: { brokerUserId },
    create: { brokerUserId, mode: "OFF" },
    update: {},
  });
}

export async function getBrokerExecutionSettingsView(brokerUserId: string): Promise<BrokerExecutionSettingsView> {
  const s = await getOrCreateBrokerExecutionSettings(brokerUserId);
  return {
    mode: s.mode,
    autoPausedUntil: s.autoPausedUntil?.toISOString() ?? null,
  };
}

export async function setBrokerExecutionMode(brokerUserId: string, mode: LecipmAutonomousExecutionMode) {
  await prisma.brokerLecipmExecutionSettings.upsert({
    where: { brokerUserId },
    create: { brokerUserId, mode },
    update: { mode },
  });
}

function initialStatus(mode: LecipmAutonomousExecutionMode, risk: LecipmExecutionRiskLevel): LecipmExecutionTaskStatus {
  if (mode === "OFF") return "DRAFT";
  if (mode === "APPROVAL_REQUIRED") return "READY_FOR_APPROVAL";
  if (risk === "HIGH" || risk === "MEDIUM") return "READY_FOR_APPROVAL";
  return "QUEUED";
}

export function canExecuteTask(
  task: { status: LecipmExecutionTaskStatus; riskLevel: LecipmExecutionRiskLevel },
  mode: LecipmAutonomousExecutionMode,
): { ok: true } | { ok: false; reason: string } {
  if (mode === "OFF") {
    return { ok: false, reason: "Execution mode is OFF — enable Assist, Safe automation, or Approval-required." };
  }
  if (task.status === "EXECUTED") return { ok: false, reason: "Already executed." };
  if (task.status === "REJECTED") return { ok: false, reason: "Task was rejected." };
  if (task.status === "DRAFT") return { ok: false, reason: "Promote the task from draft (change mode or approve in UI)." };
  if (task.status === "FAILED") return { ok: false, reason: "Use retry to re-queue this task." };

  if (mode === "APPROVAL_REQUIRED" && task.status !== "APPROVED") {
    return { ok: false, reason: "This mode requires explicit approval before every execution." };
  }

  if (task.riskLevel === "HIGH" || task.riskLevel === "MEDIUM") {
    if (task.status !== "APPROVED") {
      return { ok: false, reason: "Medium/high-risk tasks require broker approval before execution." };
    }
    return { ok: true };
  }

  if (task.status === "READY_FOR_APPROVAL") {
    return { ok: false, reason: "Approve this task first." };
  }

  if (task.status === "QUEUED" || task.status === "APPROVED") return { ok: true };

  return { ok: false, reason: "Task is not executable in its current state." };
}

export async function queueExecutionTask(
  input: QueueExecutionTaskInput,
): Promise<{ task: LecipmExecutionTask; isNew: boolean }> {
  const settings = await getOrCreateBrokerExecutionSettings(input.brokerUserId);
  const risk = input.riskLevel ?? classifyExecutionRisk(input.taskType);
  const dayBucket = new Date().toISOString().slice(0, 10);
  const idem = input.idempotencyKey ?? buildIdempotencyKey(dayBucket, input.taskType, input.entityType, input.entityId);

  const existing = await prisma.lecipmExecutionTask.findUnique({ where: { idempotencyKey: idem } });
  if (existing) return { task: existing, isNew: false };

  const status = initialStatus(settings.mode, risk);
  const task = await prisma.lecipmExecutionTask.create({
    data: {
      brokerUserId: input.brokerUserId,
      taskType: input.taskType,
      entityType: input.entityType,
      entityId: input.entityId,
      status,
      riskLevel: risk,
      priorityScore: input.priorityScore ?? 0,
      payloadJson: input.payloadJson,
      aiReasoningJson: input.aiReasoningJson,
      idempotencyKey: idem,
    },
  });

  await recordExecutionAudit({
    actorUserId: input.brokerUserId,
    event: "task_created",
    payload: { taskId: task.id, taskType: task.taskType, status: task.status },
  });
  if (status === "QUEUED") {
    await recordExecutionAudit({
      actorUserId: input.brokerUserId,
      event: "task_queued",
      payload: { taskId: task.id },
    });
  }
  if (status === "READY_FOR_APPROVAL") {
    await recordExecutionAudit({
      actorUserId: input.brokerUserId,
      event: "task_sent_for_approval",
      payload: { taskId: task.id },
    });
  }

  if (!input.skipAutoRun && status === "QUEUED" && settings.mode === "SAFE_AUTOMATION" && risk === "LOW") {
    const result = await executeTask(task.id, { actorUserId: input.brokerUserId, auto: true });
    if (!result.ok) {
      await prisma.lecipmExecutionActionLog.create({
        data: {
          taskId: task.id,
          action: "task_auto_execute_skipped",
          resultJson: { message: result.message } as Prisma.InputJsonValue,
        },
      });
    }
  }

  const fresh = await prisma.lecipmExecutionTask.findUniqueOrThrow({ where: { id: task.id } });
  return { task: fresh, isNew: true };
}

export async function executeTask(
  taskId: string,
  opts: { actorUserId: string | null; auto?: boolean },
): Promise<{ ok: true } | { ok: false; message: string }> {
  const task = await prisma.lecipmExecutionTask.findUnique({ where: { id: taskId } });
  if (!task) return { ok: false, message: "Task not found" };

  const settings = await getOrCreateBrokerExecutionSettings(task.brokerUserId);
  if (settings.autoPausedUntil && settings.autoPausedUntil > new Date()) {
    return { ok: false, message: "Auto-execution is temporarily paused after repeated failures." };
  }

  const gate = canExecuteTask(task, settings.mode);
  if (!gate.ok) return { ok: false, message: gate.reason };

  if (opts.auto) {
    const safe = await assertSafeToAutoExecute(task.brokerUserId, task.taskType, task.entityId);
    if (!safe.ok) return { ok: false, message: safe.reason };
  }

  try {
    const result = await runExecutionConnector(task);
    await prisma.lecipmExecutionActionLog.create({
      data: {
        taskId: task.id,
        action: opts.auto ? "task_auto_executed" : "task_executed",
        resultJson: result as Prisma.InputJsonValue,
      },
    });
    await prisma.lecipmExecutionTask.update({
      where: { id: task.id },
      data: { status: "EXECUTED", lastError: null, outcomeLabel: opts.auto ? "auto" : "manual" },
    });
    await recordExecutionAudit({
      actorUserId: opts.actorUserId,
      event: opts.auto ? "task_auto_executed" : "task_executed",
      payload: { taskId: task.id, taskType: task.taskType },
    });
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "execution_error";
    const updated = await prisma.lecipmExecutionTask.update({
      where: { id: task.id },
      data: {
        status: "FAILED",
        failureCount: { increment: 1 },
        lastError: msg,
      },
    });
    await recordExecutionAudit({
      actorUserId: opts.actorUserId,
      event: "task_failed",
      payload: { taskId: task.id, error: msg },
    });
    await noteExecutionFailureAndMaybePause(task.brokerUserId, updated.failureCount);
    return { ok: false, message: msg };
  }
}

export async function approveExecutionTask(taskId: string, actorUserId: string): Promise<{ ok: true } | { ok: false; message: string }> {
  const task = await prisma.lecipmExecutionTask.findUnique({ where: { id: taskId } });
  if (!task) return { ok: false, message: "Task not found" };
  if (task.brokerUserId !== actorUserId) return { ok: false, message: "Forbidden" };
  if (task.status !== "READY_FOR_APPROVAL" && task.status !== "DRAFT" && task.status !== "QUEUED") {
    return { ok: false, message: "Task is not awaiting approval." };
  }
  await prisma.lecipmExecutionTask.update({
    where: { id: taskId },
    data: { status: "APPROVED" },
  });
  await recordExecutionAudit({
    actorUserId,
    event: "task_approved",
    payload: { taskId },
  });
  return { ok: true };
}

/** Approve then run connector (one-click path). Signature for binding dispatch remains in the signature center. */
export async function approveAndExecuteTask(
  taskId: string,
  actorUserId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const approved = await approveExecutionTask(taskId, actorUserId);
  if (!approved.ok) return approved;
  return executeTask(taskId, { actorUserId, auto: false });
}

export async function rejectTask(taskId: string, actorUserId: string, reason?: string): Promise<{ ok: true } | { ok: false; message: string }> {
  const task = await prisma.lecipmExecutionTask.findUnique({ where: { id: taskId } });
  if (!task) return { ok: false, message: "Task not found" };
  if (task.brokerUserId !== actorUserId) return { ok: false, message: "Forbidden" };
  await prisma.lecipmExecutionTask.update({
    where: { id: taskId },
    data: { status: "REJECTED", lastError: reason ?? null },
  });
  await recordExecutionAudit({
    actorUserId,
    event: "task_rejected",
    payload: { taskId, reason },
  });
  return { ok: true };
}

export async function retryTask(taskId: string, actorUserId: string): Promise<{ ok: true } | { ok: false; message: string }> {
  const task = await prisma.lecipmExecutionTask.findUnique({ where: { id: taskId } });
  if (!task) return { ok: false, message: "Task not found" };
  if (task.brokerUserId !== actorUserId) return { ok: false, message: "Forbidden" };
  if (task.status !== "FAILED") return { ok: false, message: "Only failed tasks can be retried." };

  const settings = await getOrCreateBrokerExecutionSettings(task.brokerUserId);
  const nextStatus: LecipmExecutionTaskStatus =
    settings.mode === "APPROVAL_REQUIRED" || task.riskLevel === "MEDIUM" || task.riskLevel === "HIGH" ? "READY_FOR_APPROVAL" : "QUEUED";

  await prisma.lecipmExecutionTask.update({
    where: { id: taskId },
    data: { status: nextStatus, lastError: null },
  });
  await recordExecutionAudit({
    actorUserId,
    event: "task_retried",
    payload: { taskId, nextStatus },
  });
  return { ok: true };
}

export async function listExecutionTasks(brokerUserId: string) {
  return prisma.lecipmExecutionTask.findMany({
    where: { brokerUserId },
    orderBy: [{ priorityScore: "desc" }, { updatedAt: "desc" }],
    take: 200,
    include: {
      actionLogs: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });
}
