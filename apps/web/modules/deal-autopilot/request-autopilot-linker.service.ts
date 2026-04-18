/** Links open deal requests to autopilot — no auto-send. */
export function openRequestsSummary(rows: { id: string; title: string; status: string; dueAt: Date | null; requestCategory: string }[]) {
  return rows.filter((r) => !["FULFILLED", "CANCELLED"].includes(r.status));
}
