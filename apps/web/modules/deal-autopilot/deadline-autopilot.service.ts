import type { OverdueItem } from "./deal-autopilot.types";

function daysBetween(a: Date, b: Date): number {
  return Math.floor((a.getTime() - b.getTime()) / (86400 * 1000));
}

export function evaluateConditionDeadlines(
  rows: { id: string; conditionType: string; deadline: Date | null; status: string }[],
  now = new Date(),
): OverdueItem[] {
  const out: OverdueItem[] = [];
  for (const r of rows) {
    if (r.status !== "pending" || !r.deadline) continue;
    if (r.deadline < now) {
      out.push({
        id: r.id,
        kind: "condition",
        label: r.conditionType,
        dueAt: r.deadline.toISOString(),
        daysOverdue: daysBetween(now, r.deadline),
      });
    }
  }
  return out;
}

export function evaluateRequestDeadlines(
  rows: { id: string; title: string; dueAt: Date | null; status: string }[],
  now = new Date(),
): OverdueItem[] {
  const out: OverdueItem[] = [];
  for (const r of rows) {
    if (["FULFILLED", "CANCELLED"].includes(r.status)) continue;
    if (!r.dueAt || r.dueAt >= now) continue;
    out.push({
      id: r.id,
      kind: "request",
      label: r.title,
      dueAt: r.dueAt.toISOString(),
      daysOverdue: daysBetween(now, r.dueAt),
    });
  }
  return out;
}
