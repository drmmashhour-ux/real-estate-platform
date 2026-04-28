/**
 * Investor demo interaction recorder — shared types & client-safe helpers.
 * Persistence: browser localStorage (primary) + optional server mirror via demo-recorder-store (admin APIs).
 */

export type DemoRecordedEventType = "CLICK" | "NAVIGATION";

export type DemoRecordedEvent = {
  type: DemoRecordedEventType;
  path: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
};

/** Primary tape on the client */
export const DEMO_EVENTS_LS_KEY = "syria_demo_recorded_events_v1";
export const DEMO_RECORDING_ACTIVE_KEY = "syria_demo_recording_active_v1";
export const DEMO_REPLAY_ACTIVE_KEY = "syria_demo_replay_active_v1";

export const DEMO_RECORDER_MAX_EVENTS = 600;

export function parseDemoEventsJson(raw: string | null): DemoRecordedEvent[] {
  if (!raw?.trim()) return [];
  try {
    const v = JSON.parse(raw) as unknown;
    if (!Array.isArray(v)) return [];
    return v.filter(isDemoRecordedEvent);
  } catch {
    return [];
  }
}

function isDemoRecordedEvent(e: unknown): e is DemoRecordedEvent {
  if (!e || typeof e !== "object") return false;
  const o = e as Record<string, unknown>;
  return (
    (o.type === "CLICK" || o.type === "NAVIGATION") &&
    typeof o.path === "string" &&
    typeof o.timestamp === "number"
  );
}

export function persistDemoEventsLocal(events: DemoRecordedEvent[]): void {
  if (typeof window === "undefined") return;
  const trimmed = trimDemoEvents(events, DEMO_RECORDER_MAX_EVENTS);
  try {
    localStorage.setItem(DEMO_EVENTS_LS_KEY, JSON.stringify(trimmed));
  } catch {
    /* quota */
  }
}

export function loadDemoEventsLocal(): DemoRecordedEvent[] {
  if (typeof window === "undefined") return [];
  return parseDemoEventsJson(localStorage.getItem(DEMO_EVENTS_LS_KEY));
}

export function trimDemoEvents(events: DemoRecordedEvent[], max = DEMO_RECORDER_MAX_EVENTS): DemoRecordedEvent[] {
  const sorted = [...events].sort((a, b) => a.timestamp - b.timestamp);
  return sorted.slice(-max);
}

export function appendDemoEventLocal(ev: DemoRecordedEvent): DemoRecordedEvent[] {
  if (typeof window === "undefined") return [];
  const next = trimDemoEvents([...loadDemoEventsLocal(), ev]);
  persistDemoEventsLocal(next);
  return next;
}

export function clearDemoEventsLocal(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(DEMO_EVENTS_LS_KEY);
  } catch {
    /* ignore */
  }
}

/** Strict gate aligned with ops expectation for telemetry (static env flag). */
export function canRecordInvestorDemoStaticEnv(): boolean {
  return process.env.INVESTOR_DEMO_MODE === "true";
}
