/**
 * Per-day persistence for the daily checklist (client-only).
 * Replace with server sync + agent id when API exists.
 */

const VERSION = 1;
const key = (dateKey: string) => `lecipm-field-daily-checklist:v${VERSION}:${dateKey}`;

export type DailyKpi = {
  calls: number;
  demos: number;
  conversions: number;
};

export type ChecklistDayState = {
  dateKey: string;
  /** blockId -> taskId -> done */
  done: Record<string, Record<string, boolean>>;
  notes: string;
  kpi: DailyKpi;
};

function defaultKpi(): DailyKpi {
  return { calls: 0, demos: 0, conversions: 0 };
}

export function loadChecklistState(dateKey: string): ChecklistDayState {
  if (typeof window === "undefined") {
    return { dateKey, done: {}, notes: "", kpi: defaultKpi() };
  }
  try {
    const raw = localStorage.getItem(key(dateKey));
    if (!raw) return { dateKey, done: {}, notes: "", kpi: defaultKpi() };
    const p = JSON.parse(raw) as ChecklistDayState;
    if (p.dateKey !== dateKey) return { dateKey, done: {}, notes: "", kpi: defaultKpi() };
    if (!p.done || typeof p.done !== "object") p.done = {};
    if (typeof p.notes !== "string") p.notes = "";
    if (!p.kpi || typeof p.kpi !== "object") p.kpi = defaultKpi();
    return p;
  } catch {
    return { dateKey, done: {}, notes: "", kpi: defaultKpi() };
  }
}

export function saveChecklistState(state: ChecklistDayState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key(state.dateKey), JSON.stringify(state));
  } catch {
    /* ignore */
  }
}
