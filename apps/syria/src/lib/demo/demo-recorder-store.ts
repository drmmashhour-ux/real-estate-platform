/**
 * Optional server-memory mirror for investor demo recordings (Syria Node process only).
 * Acts as a lightweight **DemoSessionEvents** buffer — not a DB table; client `localStorage` remains canonical.
 */

import type { DemoRecordedEvent } from "@/lib/demo/demo-recorder";

const MAX = 800;
const bySession = new Map<string, DemoRecordedEvent[]>();

export function demoRecorderClear(sessionId: string): void {
  bySession.set(sessionId, []);
}

export function demoRecorderPush(sessionId: string, ev: DemoRecordedEvent): void {
  const cur = bySession.get(sessionId) ?? [];
  if (cur.length >= MAX) return;
  cur.push(ev);
  bySession.set(sessionId, [...cur]);
}

export function demoRecorderSnapshot(sessionId: string): DemoRecordedEvent[] {
  return [...(bySession.get(sessionId) ?? [])];
}
