import "server-only";

import { getLegacyDB } from "@/lib/db/legacy";
import { getLaunchStatus } from "@/lib/launch/controller";
import { launchPlan } from "@/lib/launch/plan";

const db = getLegacyDB();

export const LAUNCH_DAYS = 7;

function clampDay(day: number): number {
  if (Number.isNaN(day) || !Number.isFinite(day)) return 1;
  return Math.min(LAUNCH_DAYS, Math.max(1, Math.floor(day)));
}

/**
 * Resolves 1–7 from `User.launchPlanStartAt` (inclusive of start day) or `1` when unset.
 * Optional manual override may be provided by callers; see admin launch page `?day=`.
 */
export async function getResolvedLaunchDayNumber(userId: string): Promise<number> {
  const u = await db.user.findUnique({
    where: { id: userId },
    select: { launchPlanStartAt: true },
  });
  if (!u?.launchPlanStartAt) return 1;
  const start = new Date(u.launchPlanStartAt);
  start.setHours(0, 0, 0, 0);
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  const diff = Math.floor((t.getTime() - start.getTime()) / 86_400_000) + 1;
  return clampDay(diff);
}

export type LaunchProgressForDay = {
  day: number;
  completedTasks: number;
  totalTasks: number;
  taskStates: boolean[];
};

/**
 * Per-day task completion. When `day` is omitted, uses {@link getResolvedLaunchDayNumber}.
 */
export async function getLaunchProgress(userId: string, day?: number): Promise<LaunchProgressForDay> {
  const d = clampDay(day ?? (await getResolvedLaunchDayNumber(userId)));
  const plan = launchPlan[d - 1];
  if (!plan) {
    return { day: d, completedTasks: 0, totalTasks: 0, taskStates: [] };
  }
  const totalTasks = plan.tasks.length;
  const rows = await db.launchProgress.findMany({
    where: { userId, day: d },
  });
  const byIndex = new Map<number, boolean>();
  for (const r of rows) {
    if (r.taskIndex >= 0 && r.taskIndex < totalTasks) {
      byIndex.set(r.taskIndex, r.completed);
    }
  }
  const taskStates = plan.tasks.map((_, i) => byIndex.get(i) === true);
  const completedTasks = taskStates.filter(Boolean).length;
  return { day: d, completedTasks, totalTasks, taskStates };
}

export type GlobalLaunchProgress = {
  byDay: { day: number; completedTasks: number; totalTasks: number }[];
  totalCompleted: number;
  totalTasksAll: number;
};

export async function getGlobalLaunchProgress(userId: string): Promise<GlobalLaunchProgress> {
  const allRows = await db.launchProgress.findMany({ where: { userId } });
  const rowKey = (day: number, taskIndex: number) => `${day}:${taskIndex}`;
  const done = new Set<string>();
  for (const r of allRows) {
    if (r.completed) done.add(rowKey(r.day, r.taskIndex));
  }
  const byDay: GlobalLaunchProgress["byDay"] = [];
  let totalCompleted = 0;
  let totalTasksAll = 0;
  for (const p of launchPlan) {
    const n = p.tasks.length;
    let c = 0;
    for (let i = 0; i < n; i++) {
      if (done.has(rowKey(p.day, i))) c++;
    }
    byDay.push({ day: p.day, completedTasks: c, totalTasks: n });
    totalCompleted += c;
    totalTasksAll += n;
  }
  return { byDay, totalCompleted, totalTasksAll };
}

export type TodaysTopTask = { day: number; taskIndex: number; text: string };

/**
 * “Today’s plan” — current resolved day, top 3 outstanding tasks (or fewer).
 */
export async function getTodaysLaunchTasks(userId: string, limit = 3): Promise<{
  currentDay: number;
  topTasks: TodaysTopTask[];
}> {
  const platform = await getLaunchStatus();
  const currentDay =
    platform.status === "running" && platform.startedAt
      ? platform.currentDay
      : await getResolvedLaunchDayNumber(userId);
  const s = await getLaunchProgress(userId, currentDay);
  const plan = launchPlan[currentDay - 1];
  if (!plan) {
    return { currentDay, topTasks: [] };
  }
  const out: TodaysTopTask[] = [];
  for (let i = 0; i < plan.tasks.length && out.length < limit; i++) {
    if (s.taskStates[i]) continue;
    out.push({ day: currentDay, taskIndex: i, text: plan.tasks[i]! });
  }
  return { currentDay, topTasks: out };
}

/**
 * Read-only plan slice — `launchPlan` is not mutated; only DB rows for this user.
 */
export async function updateLaunchTask(
  userId: string,
  day: number,
  taskIndex: number,
  completed: boolean
): Promise<void> {
  const d = clampDay(day);
  const plan = launchPlan[d - 1];
  if (!plan) return;
  if (taskIndex < 0 || taskIndex >= plan.tasks.length) return;

  const existing = await db.launchProgress.findFirst({
    where: { userId, day: d, taskIndex },
  });
  if (existing) {
    await db.launchProgress.update({
      where: { id: existing.id },
      data: { completed },
    });
  } else {
    await db.launchProgress.create({
      data: { userId, day: d, taskIndex, completed },
    });
  }
}

export async function setLaunchPlanStartAt(userId: string, at: Date | null): Promise<void> {
  await db.user.update({
    where: { id: userId },
    data: { launchPlanStartAt: at },
  });
}

export { getLaunchPhaseBand } from "@/lib/launch/launchDayPhase";
export { LAUNCH_DAYS };
