/**
 * In-process duplicate-hint registry for observability (not a substitute for Stripe idempotency keys).
 */
const seen = new Map<string, number>();
const TTL_MS = 5 * 60 * 1000;
const MAX_KEYS = 2000;

function prune(now: number): void {
  for (const [k, at] of seen) {
    if (now - at > TTL_MS) seen.delete(k);
  }
  while (seen.size > MAX_KEYS) {
    const first = seen.keys().next().value;
    if (first) seen.delete(first);
  }
}

export function peekDuplicateIdempotencyKey(key: string | undefined): boolean {
  if (!key) return false;
  const now = Date.now();
  prune(now);
  if (seen.has(key)) return true;
  seen.set(key, now);
  return false;
}
