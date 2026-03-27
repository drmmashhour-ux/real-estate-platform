export const DAILY_TASK_TYPES = [
  "messages_sent",
  "content_posted",
  "calls_booked",
  "users_onboarded",
] as const;

export type DailyTaskType = (typeof DAILY_TASK_TYPES)[number];

export type DailyTaskDefaultRow = {
  taskType: DailyTaskType;
  targetCount: number;
};

/** Default coaching targets (user taps to record — no automation). */
export const DEFAULT_DAILY_TASKS: readonly DailyTaskDefaultRow[] = [
  { taskType: "messages_sent", targetCount: 20 },
  { taskType: "content_posted", targetCount: 1 },
  { taskType: "calls_booked", targetCount: 1 },
  { taskType: "users_onboarded", targetCount: 1 },
] as const;

export function isDailyTaskType(v: string): v is DailyTaskType {
  return (DAILY_TASK_TYPES as readonly string[]).includes(v);
}

export function deriveTaskStatus(completedCount: number, targetCount: number): "pending" | "in_progress" | "completed" {
  if (completedCount <= 0) return "pending";
  if (completedCount >= targetCount) return "completed";
  return "in_progress";
}

/** Cap increment so we never exceed target (idempotent-friendly). */
export function computeIncrementedCount(
  completedCount: number,
  targetCount: number,
  delta: number
): { nextCompleted: number; status: ReturnType<typeof deriveTaskStatus> } {
  const safeDelta = Math.max(0, Math.floor(Number.isFinite(delta) ? delta : 0));
  const nextCompleted = Math.min(targetCount, completedCount + safeDelta);
  return { nextCompleted, status: deriveTaskStatus(nextCompleted, targetCount) };
}
