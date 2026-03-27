import type { DailyTaskType } from "../domain/dailyTaskTypes";

export type DailyTaskSnapshot = {
  taskType: DailyTaskType | string;
  targetCount: number;
  completedCount: number;
  repliesNote?: string | null;
  metadata?: { callBooked?: boolean; callCompleted?: boolean; linkedLeadId?: string | null } | null;
};

export type DailyExecutionReport = {
  dateLabel: string;
  messagesSent: number;
  messagesTarget: number;
  repliesNote: string | null;
  contentPosted: number;
  contentTarget: number;
  callsBooked: number;
  callsTarget: number;
  callCompleted: boolean;
  usersOnboarded: number;
  usersTarget: number;
  summaryLines: string[];
};

function pick(tasks: DailyTaskSnapshot[], type: string) {
  return tasks.find((x) => x.taskType === type);
}

/**
 * Read-only summary from today’s rows (no side effects).
 */
export function generateDailyReport(tasks: DailyTaskSnapshot[], dateLabel: string): DailyExecutionReport {
  const m = pick(tasks, "messages_sent");
  const c = pick(tasks, "content_posted");
  const calls = pick(tasks, "calls_booked");
  const u = pick(tasks, "users_onboarded");

  const callMeta = calls?.metadata as { callCompleted?: boolean } | null | undefined;
  const callCompleted = Boolean(callMeta?.callCompleted);

  const summaryLines: string[] = [];
  if (m) summaryLines.push(`Messages: ${m.completedCount}/${m.targetCount} (you send each one manually).`);
  if (m?.repliesNote?.trim()) summaryLines.push(`Replies / notes: ${m.repliesNote.trim()}`);
  if (c) summaryLines.push(`Content posted: ${c.completedCount}/${c.targetCount}`);
  if (calls) summaryLines.push(`Calls booked: ${calls.completedCount}/${calls.targetCount}${callCompleted ? " — marked completed" : ""}`);
  if (u) summaryLines.push(`Users onboarded: ${u.completedCount}/${u.targetCount}`);

  return {
    dateLabel,
    messagesSent: m?.completedCount ?? 0,
    messagesTarget: m?.targetCount ?? 20,
    repliesNote: m?.repliesNote?.trim() ?? null,
    contentPosted: c?.completedCount ?? 0,
    contentTarget: c?.targetCount ?? 1,
    callsBooked: calls?.completedCount ?? 0,
    callsTarget: calls?.targetCount ?? 1,
    callCompleted,
    usersOnboarded: u?.completedCount ?? 0,
    usersTarget: u?.targetCount ?? 1,
    summaryLines,
  };
}
