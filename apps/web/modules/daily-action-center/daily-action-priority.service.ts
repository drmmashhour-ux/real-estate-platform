import type { DailyAction, DailyActionUrgency } from "./daily-action-center.types";

/** Rank bucket from due date + type heuristics — server-side only. */
export function assignUrgency(input: {
  dueAt: Date | null;
  hasDeadlineToday: boolean;
  isOverdue: boolean;
  typePriority: "critical" | "high" | "normal";
}): DailyActionUrgency {
  if (input.isOverdue || input.hasDeadlineToday || input.typePriority === "critical") {
    return "must_do_now";
  }
  const d = input.dueAt;
  if (d) {
    const now = new Date();
    const eod = new Date(now);
    eod.setHours(23, 59, 59, 999);
    if (d <= eod) return "do_today";
    const week = new Date(now);
    week.setDate(week.getDate() + 7);
    if (d <= week) return "do_this_week";
  }
  if (input.typePriority === "high") return "do_today";
  return "do_this_week";
}

export function sortActionsByUrgencyThenDue(actions: DailyAction[]): DailyAction[] {
  const rank: Record<DailyActionUrgency, number> = {
    must_do_now: 0,
    do_today: 1,
    do_this_week: 2,
  };
  return [...actions].sort((a, b) => {
    const dr = rank[a.urgency] - rank[b.urgency];
    if (dr !== 0) return dr;
    const ad = a.dueAt ? Date.parse(a.dueAt) : Infinity;
    const bd = b.dueAt ? Date.parse(b.dueAt) : Infinity;
    return ad - bd;
  });
}
