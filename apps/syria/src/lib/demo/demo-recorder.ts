/**
 * Investor demo interaction recorder — shared types & client-safe helpers.
 *
 * ## Event shape (stored tape)
 * ```json
 * { "type": "CLICK" | "NAVIGATION", "path": "/en/...", "timestamp": 1730000000000, "metadata": {} }
 * ```
 *
 * ## Persistence
 * - **Client:** `localStorage` (`DEMO_EVENTS_LS_KEY`)
 * - **Server (optional mirror):** in-memory buffer per session — {@link demoRecorderPush} in `demo-recorder-store.ts`
 *   (admin APIs under `/api/admin/demo-record/*`). Not a substitute for the client tape.
 *
 * ## When recording runs
 * Hooks live in {@link DemoRecordingProvider}. They run only when the layout passes **`demoUxActive`**
 * (`isInvestorDemoModeActive()` server-side — covers **`INVESTOR_DEMO_MODE=true`** and/or **`INVESTOR_DEMO_MODE_RUNTIME`**
 * / session TTL). Use {@link recordDemoEventWhen} so events are never appended when demo UX is off.
 *
 * Replay stays navigation + UI pulse only — see {@link replayDemoSession}.
 */

export type DemoRecordedEventType = "CLICK" | "NAVIGATION";

export type DemoRecordedEvent = {
  type: DemoRecordedEventType;
  path: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
};

/** Alias — one row in the demo session tape (same as {@link DemoRecordedEvent}). */
export type DemoSessionEvent = DemoRecordedEvent;

/** Primary tape on the client */
export const DEMO_EVENTS_LS_KEY = "syria_demo_recorded_events_v1";
export const DEMO_RECORDING_ACTIVE_KEY = "syria_demo_recording_active_v1";
export const DEMO_REPLAY_ACTIVE_KEY = "syria_demo_replay_active_v1";

export const DEMO_RECORDER_MAX_EVENTS = 600;

export function isValidDemoRecordedEvent(e: unknown): e is DemoRecordedEvent {
  if (!e || typeof e !== "object") return false;
  const o = e as Record<string, unknown>;
  return (
    (o.type === "CLICK" || o.type === "NAVIGATION") &&
    typeof o.path === "string" &&
    typeof o.timestamp === "number"
  );
}

export function parseDemoEventsJson(raw: string | null): DemoRecordedEvent[] {
  if (!raw?.trim()) return [];
  try {
    const v = JSON.parse(raw) as unknown;
    if (!Array.isArray(v)) return [];
    return v.filter(isValidDemoRecordedEvent);
  } catch {
    return [];
  }
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

/**
 * Append one interaction to the local tape when **`canRecord`** is true (investor demo UX + recording enabled).
 * Prefer this over {@link recordDemoEvent} at call sites that might run outside demo mode.
 */
export function recordDemoEventWhen(canRecord: boolean, ev: DemoRecordedEvent): DemoRecordedEvent[] {
  if (!canRecord) return loadDemoEventsLocal();
  return recordDemoEvent(ev);
}

/**
 * Append one interaction to the local tape. Intended for use while investor demo UX is active
 * (layout + {@link DemoRecordingProvider}); replay stays navigation + UI pulse only — see {@link replayDemoSession}.
 */
export function recordDemoEvent(ev: DemoRecordedEvent): DemoRecordedEvent[] {
  if (typeof window === "undefined") return [];
  if (!isValidDemoRecordedEvent(ev)) {
    return loadDemoEventsLocal();
  }
  return appendDemoEventLocal(ev);
}

/**
 * Build-time / Node-only check — **static** `INVESTOR_DEMO_MODE`. Runtime demo sessions use
 * `INVESTOR_DEMO_MODE_RUNTIME`; the browser gate is `demoUxActive` from the server layout.
 */
export function canRecordInvestorDemoStaticEnv(): boolean {
  return process.env.INVESTOR_DEMO_MODE === "true";
}
