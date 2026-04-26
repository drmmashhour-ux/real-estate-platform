import type { LecipmExecutionTaskType } from "@prisma/client";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();

const MAX_AUTO_EXECUTIONS_PER_HOUR = 24;
const FAILURE_STREAK_BEFORE_PAUSE = 4;
const PAUSE_DURATION_MS = 60 * 60 * 1000;
const ENTITY_COOLDOWN_MS = 8 * 60 * 1000;

export function buildIdempotencyKey(
  dayBucket: string,
  taskType: string,
  entityType: string,
  entityId: string,
): string {
  return `${dayBucket}:${taskType}:${entityType}:${entityId}`;
}

export async function assertSafeToAutoExecute(
  brokerUserId: string,
  taskType: LecipmExecutionTaskType,
  entityId: string,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const settings = await prisma.brokerLecipmExecutionSettings.findUnique({
    where: { brokerUserId },
  });
  if (settings?.autoPausedUntil && settings.autoPausedUntil > new Date()) {
    return { ok: false, reason: "auto_paused_until_cooldown" };
  }

  const since = new Date(Date.now() - 60 * 60 * 1000);
  const recentAuto = await prisma.lecipmExecutionActionLog.count({
    where: {
      action: "task_auto_executed",
      createdAt: { gte: since },
      task: { brokerUserId },
    },
  });
  if (recentAuto >= MAX_AUTO_EXECUTIONS_PER_HOUR) {
    return { ok: false, reason: "hourly_auto_execution_cap" };
  }

  const cooldownCut = new Date(Date.now() - ENTITY_COOLDOWN_MS);
  const recentSame = await prisma.lecipmExecutionTask.findFirst({
    where: {
      brokerUserId,
      entityId,
      taskType,
      status: "EXECUTED",
      updatedAt: { gte: cooldownCut },
    },
    select: { id: true },
  });
  if (recentSame) {
    return { ok: false, reason: "entity_cooldown" };
  }

  return { ok: true };
}

export async function noteExecutionFailureAndMaybePause(brokerUserId: string, failureCount: number): Promise<void> {
  if (failureCount < FAILURE_STREAK_BEFORE_PAUSE) return;
  const until = new Date(Date.now() + PAUSE_DURATION_MS);
  const row = await prisma.brokerLecipmExecutionSettings.findUnique({ where: { brokerUserId } });
  if (row) {
    await prisma.brokerLecipmExecutionSettings.update({
      where: { brokerUserId },
      data: { autoPausedUntil: until },
    });
  } else {
    await prisma.brokerLecipmExecutionSettings.create({
      data: { brokerUserId, mode: "OFF", autoPausedUntil: until },
    });
  }
}
