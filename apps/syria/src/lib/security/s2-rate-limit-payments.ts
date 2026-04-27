/**
 * S3 — stricter limit for /api/payments/* (10 req / 60s per IP).
 */
const WINDOW_MS = 60_000;
const MAX = 10;

type Entry = { t: number[] };
const buckets = new Map<string, Entry>();

function prune(entry: Entry, now: number) {
  entry.t = entry.t.filter((x) => now - x < WINDOW_MS);
}

export function s2CheckRateLimitPayments(ip: string): { ok: true } | { ok: false; retryAfterSec: number } {
  const key = ip;
  const now = Date.now();
  let e = buckets.get(key);
  if (!e) {
    e = { t: [] };
    buckets.set(key, e);
  }
  prune(e, now);
  if (e.t.length >= MAX) {
    const oldest = e.t[0] ?? now;
    const retryAfterSec = Math.max(1, Math.ceil((WINDOW_MS - (now - oldest)) / 1000));
    return { ok: false, retryAfterSec };
  }
  e.t.push(now);
  return { ok: true };
}
