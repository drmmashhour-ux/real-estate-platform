/**
 * S2 — IP rate limiting for API routes (in-process; per-node in serverless).
 * Default: 15 requests / 60s per key (IP + optional route id).
 */
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 15;

type Entry = { t: number[] };

const buckets = new Map<string, Entry>();

function prune(entry: Entry, now: number) {
  entry.t = entry.t.filter((x) => now - x < WINDOW_MS);
}

export function s2CheckRateLimit(key: string): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  let e = buckets.get(key);
  if (!e) {
    e = { t: [] };
    buckets.set(key, e);
  }
  prune(e, now);
  if (e.t.length >= MAX_PER_WINDOW) {
    const oldest = e.t[0] ?? now;
    const retryAfterSec = Math.max(1, Math.ceil((WINDOW_MS - (now - oldest)) / 1000));
    return { ok: false, retryAfterSec };
  }
  e.t.push(now);
  return { ok: true };
}

export function s2RateLimitMax(): number {
  return MAX_PER_WINDOW;
}
