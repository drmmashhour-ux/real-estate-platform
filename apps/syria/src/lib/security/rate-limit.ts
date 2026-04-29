/**
 * In-memory rate limit for serverless single-instance bursts (best-effort).
 * For cross-instance limits use Redis / edge rate limiting upstream.
 */
const memory = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(
  key: string,
  limit = 30,
  windowMs = 60_000,
): { allowed: true } | { allowed: false } {
  const now = Date.now();
  const record = memory.get(key);
  if (!record || record.resetAt < now) {
    memory.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }
  record.count += 1;
  if (record.count > limit) {
    return { allowed: false };
  }
  return { allowed: true };
}
