import { randomUUID } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import { DEFAULT_DAILY_TASKS, type DailyTaskType, computeIncrementedCount, deriveTaskStatus } from "../domain/dailyTaskTypes";

export function startOfUtcDay(d = new Date()): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export async function ensureDefaultDailyTasks(db: PrismaClient, userId: string, taskDate: Date): Promise<void> {
  await db.dailyTask.createMany({
    data: DEFAULT_DAILY_TASKS.map((def) => ({
      id: randomUUID(),
      userId,
      taskDate,
      taskType: def.taskType,
      targetCount: def.targetCount,
      completedCount: 0,
      status: "pending",
    })),
    skipDuplicates: true,
  });
}

export async function listTasksForDay(db: PrismaClient, userId: string, taskDate: Date) {
  return db.dailyTask.findMany({
    where: { userId, taskDate },
    orderBy: { taskType: "asc" },
  });
}

export async function incrementDailyTask(
  db: PrismaClient,
  userId: string,
  taskDate: Date,
  taskType: DailyTaskType,
  delta: number
) {
  const row = await db.dailyTask.findUnique({
    where: {
      userId_taskDate_taskType: { userId, taskDate, taskType },
    },
  });
  if (!row) return { ok: false as const, error: "Task not found" };

  const { nextCompleted, status } = computeIncrementedCount(row.completedCount, row.targetCount, delta);
  const updated = await db.dailyTask.update({
    where: { id: row.id },
    data: { completedCount: nextCompleted, status },
  });
  return { ok: true as const, task: updated };
}

export async function mergeTaskMetadata(
  db: PrismaClient,
  userId: string,
  taskDate: Date,
  taskType: DailyTaskType,
  patch: Record<string, unknown>
) {
  const row = await db.dailyTask.findUnique({
    where: { userId_taskDate_taskType: { userId, taskDate, taskType } },
  });
  if (!row) return { ok: false as const, error: "Task not found" };

  const prev =
    row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
      ? (row.metadata as Record<string, unknown>)
      : {};
  const metadata = { ...prev, ...patch } as object;

  const status = deriveTaskStatus(row.completedCount, row.targetCount);
  const updated = await db.dailyTask.update({
    where: { id: row.id },
    data: { metadata, status },
  });
  return { ok: true as const, task: updated };
}

export async function updateRepliesNote(
  db: PrismaClient,
  userId: string,
  taskDate: Date,
  note: string | null
) {
  const row = await db.dailyTask.findUnique({
    where: {
      userId_taskDate_taskType: { userId, taskDate, taskType: "messages_sent" },
    },
  });
  if (!row) return { ok: false as const, error: "messages_sent task not found" };

  const updated = await db.dailyTask.update({
    where: { id: row.id },
    data: { repliesNote: note?.slice(0, 4000) ?? null },
  });
  return { ok: true as const, task: updated };
}
