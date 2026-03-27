import type { PrismaClient } from "@prisma/client";
import { isDailyTaskType, type DailyTaskType } from "../domain/dailyTaskTypes";
import { bumpDailyMetric, type MetricCounter } from "../infrastructure/dailyMetricsRepository";
import {
  ensureDefaultDailyTasks,
  incrementDailyTask,
  listTasksForDay,
  mergeTaskMetadata,
  startOfUtcDay,
  updateRepliesNote,
} from "../infrastructure/dailyTaskRepository";
import { generateDailyReport, type DailyTaskSnapshot } from "./generateDailyReport";

const TASK_TO_METRIC: Partial<Record<DailyTaskType, MetricCounter>> = {
  messages_sent: "messagesSent",
  calls_booked: "callsBooked",
  users_onboarded: "usersOnboarded",
};

export async function resetDailyTasks(db: PrismaClient, userId: string, date = new Date()): Promise<void> {
  const taskDate = startOfUtcDay(date);
  await ensureDefaultDailyTasks(db, userId, taskDate);
}

export async function getTodayTasks(db: PrismaClient, userId: string, date = new Date()) {
  const taskDate = startOfUtcDay(date);
  await ensureDefaultDailyTasks(db, userId, taskDate);
  const tasks = await listTasksForDay(db, userId, taskDate);
  return { taskDate, tasks };
}

export async function incrementTask(
  db: PrismaClient,
  userId: string,
  taskType: string,
  delta = 1,
  date = new Date()
) {
  if (!isDailyTaskType(taskType)) {
    return { ok: false as const, error: "Invalid task type" };
  }
  const taskDate = startOfUtcDay(date);
  await ensureDefaultDailyTasks(db, userId, taskDate);
  const result = await incrementDailyTask(db, userId, taskDate, taskType, delta);
  if (!result.ok) return result;

  const metricField = TASK_TO_METRIC[taskType as DailyTaskType];
  if (metricField) {
    await bumpDailyMetric(db, userId, taskDate, metricField, delta);
  }
  return result;
}

export async function markCallCompleted(
  db: PrismaClient,
  userId: string,
  args: { linkedLeadId?: string | null },
  date = new Date()
) {
  const taskDate = startOfUtcDay(date);
  await ensureDefaultDailyTasks(db, userId, taskDate);
  return mergeTaskMetadata(db, userId, taskDate, "calls_booked", {
    callCompleted: true,
    ...(args.linkedLeadId ? { linkedLeadId: args.linkedLeadId } : {}),
  });
}

export async function setRepliesNote(db: PrismaClient, userId: string, note: string | null, date = new Date()) {
  const taskDate = startOfUtcDay(date);
  await ensureDefaultDailyTasks(db, userId, taskDate);
  return updateRepliesNote(db, userId, taskDate, note);
}

export function buildCoachingReminders(
  tasks: { taskType: string; completedCount: number; targetCount: number }[],
  now = new Date()
): string[] {
  const hour = now.getUTCHours();
  const out: string[] = [];
  const messages = tasks.find((t) => t.taskType === "messages_sent");
  if (messages && messages.completedCount === 0 && hour >= 14) {
    out.push("You haven't logged messages today — run a short outreach block when ready.");
  } else if (messages && messages.completedCount < Math.min(5, messages.targetCount) && hour >= 17) {
    out.push("You haven't sent many messages today — keep chipping away toward your target.");
  }
  const content = tasks.find((t) => t.taskType === "content_posted");
  if (content && content.completedCount < 1 && hour >= 11) {
    out.push("Post your daily content when you have a slot.");
  }
  return out;
}

export async function getTodayReportPayload(db: PrismaClient, userId: string, date = new Date()) {
  const { taskDate, tasks } = await getTodayTasks(db, userId, date);
  const snapshots: DailyTaskSnapshot[] = tasks.map((t) => ({
    taskType: t.taskType,
    targetCount: t.targetCount,
    completedCount: t.completedCount,
    repliesNote: t.repliesNote,
    metadata: t.metadata as DailyTaskSnapshot["metadata"],
  }));
  const dateLabel = taskDate.toISOString().slice(0, 10);
  return {
    report: generateDailyReport(snapshots, dateLabel),
    reminders: buildCoachingReminders(tasks, date),
  };
}
