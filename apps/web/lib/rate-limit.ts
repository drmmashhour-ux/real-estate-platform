/**
 * In-memory rate limiting for API routes. For production at scale, use Redis.
 * Usage: check rate limit at the start of a route; return 429 if exceeded.
 */

const store = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 60 * 1000; // 1 minute
const DEFAULT_MAX = 60;      // 60 requests per window per key

export interface RateLimitOptions {
  windowMs?: number;
  max?: number;
}

/**
 * Check rate limit for a key (e.g. IP or userId). Returns true if allowed, false if exceeded.
 * Call getRateLimitHeaders() to send Retry-After / X-RateLimit-* in response.
 */
export function checkRateLimit(
  key: string,
  options: RateLimitOptions = {}
): { allowed: boolean; remaining: number; resetAt: number } {
  const windowMs = options.windowMs ?? WINDOW_MS;
  const max = options.max ?? DEFAULT_MAX;
  const now = Date.now();
  const entry = store.get(key);

  if (!entry) {
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: max - 1, resetAt };
  }

  if (now >= entry.resetAt) {
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: max - 1, resetAt };
  }

  entry.count += 1;
  const remaining = Math.max(0, max - entry.count);
  const allowed = entry.count <= max;
  return { allowed, remaining, resetAt: entry.resetAt };
}

export function getRateLimitHeaders(result: { remaining: number; resetAt: number }): Record<string, string> {
  return {
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
  };
}

/** Clear store (useful for tests). */
export function clearRateLimitStore(): void {
  store.clear();
}
