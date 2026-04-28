/**
 * Server-memory mirror for investor demo recordings (Syria Node process only).
 * Does not replace client tape — used when admin APIs sync events.
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
