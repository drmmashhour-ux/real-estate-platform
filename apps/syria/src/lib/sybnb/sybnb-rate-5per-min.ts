/**
 * SYBNB-7: 5 requests / 60s per key (in-process; per serverless instance).
 * Separate from S2 (15/min) for booking + report abuse control.
 */
const WINDOW_MS = 60_000;
const MAX = 5;

type Entry = { t: number[] };
const buckets = new Map<string, Entry>();

function prune(entry: Entry, now: number) {
  entry.t = entry.t.filter((x) => now - x < WINDOW_MS);
}

export function sybnbCheck5PerMin(key: string): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  let e = buckets.get(key);
  if (!e) {
    e = { t: [] };
    buckets.set(key, e);
  }
  prune(e, now);
  if (e.t.length >= MAX) {
    const oldest = e.t[0] ?? now;
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((WINDOW_MS - (now - oldest)) / 1000)) };
  }
  e.t.push(now);
  return { ok: true };
}
