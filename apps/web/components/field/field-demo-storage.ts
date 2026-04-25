const STORAGE_KEY = "lecipm-field-demo-logs-v1";

export type FieldOutcome = "demo_done" | "interested" | "not_interested" | "follow_up";

export type FieldVisitLog = {
  id: string;
  leadId: string;
  brokerName: string;
  outcome: FieldOutcome;
  note?: string;
  at: string;
};

function safeParse(raw: string | null): FieldVisitLog[] {
  if (!raw) return [];
  try {
    const p = JSON.parse(raw) as unknown;
    if (!Array.isArray(p)) return [];
    return p.filter(
      (x): x is FieldVisitLog =>
        typeof x === "object" &&
        x != null &&
        typeof (x as FieldVisitLog).id === "string" &&
        typeof (x as FieldVisitLog).leadId === "string" &&
        typeof (x as FieldVisitLog).brokerName === "string" &&
        typeof (x as FieldVisitLog).outcome === "string" &&
        typeof (x as FieldVisitLog).at === "string",
    );
  } catch {
    return [];
  }
}

export function loadFieldVisitLogs(): FieldVisitLog[] {
  if (typeof window === "undefined") return [];
  return safeParse(localStorage.getItem(STORAGE_KEY));
}

export function saveFieldVisitLogs(logs: FieldVisitLog[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  } catch {
    /* ignore */
  }
}

export function addFieldVisitLog(input: {
  leadId: string;
  brokerName: string;
  outcome: FieldOutcome;
  note?: string;
}): FieldVisitLog {
  const row: FieldVisitLog = {
    id: `v-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    leadId: input.leadId,
    brokerName: input.brokerName,
    outcome: input.outcome,
    note: input.note?.trim() || undefined,
    at: new Date().toISOString(),
  };
  const next = [row, ...loadFieldVisitLogs()];
  saveFieldVisitLogs(next);
  return row;
}

function startOfDay(d: Date): number {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
}

export function todayFieldProgress(logs: FieldVisitLog[]): {
  uniqueVisits: number;
  demosDone: number;
  followUps: number;
} {
  const t0 = startOfDay(new Date());
  const today = logs.filter((l) => new Date(l.at).getTime() >= t0);
  const uniqueLeads = new Set(today.map((l) => l.leadId)).size;
  const demosDone = today.filter((l) => l.outcome === "demo_done").length;
  const followUps = today.filter((l) => l.outcome === "follow_up").length;
  return { uniqueVisits: uniqueLeads, demosDone, followUps };
}

export function fieldPerformanceStats(logs: FieldVisitLog[], days = 7): {
  demosDone: number;
  conversions: number;
  activity: number;
} {
  const cutoff = Date.now() - days * 86400000;
  const recent = logs.filter((l) => new Date(l.at).getTime() >= cutoff);
  return {
    demosDone: recent.filter((l) => l.outcome === "demo_done").length,
    conversions: recent.filter((l) => l.outcome === "interested").length,
    activity: recent.length,
  };
}
