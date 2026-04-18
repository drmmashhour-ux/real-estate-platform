/**
 * Optional Redis-backed rate limits (shared across serverless instances).
 * Falls back to in-memory `checkRateLimit` when `REDIS_URL` is unset.
 */
import { getRedisClient } from "@/lib/cache/redis";
import { checkRateLimit, getRateLimitHeaders, type RateLimitOptions } from "@/lib/rate-limit";

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  /** true when counts came from Redis */
  distributed: boolean;
};

function windowSeconds(opts: RateLimitOptions): number {
  return Math.ceil((opts.windowMs ?? 60_000) / 1000);
}

/**
 * Distributed fixed window using INCR + EXPIRE. When Redis is unavailable, uses in-memory store.
 */
export async function checkRateLimitDistributed(
  key: string,
  options: RateLimitOptions = {}
): Promise<RateLimitResult> {
  const windowMs = options.windowMs ?? 60_000;
  const max = options.max ?? 60;
  const redis = await getRedisClient();
  if (!redis) {
    const r = checkRateLimit(key, options);
    return { ...r, distributed: false };
  }

  const rkey = `rl:${key}`;
  const ws = windowSeconds(options);
  try {
    const count = await redis.incrWithExpire(rkey, ws);
    const ttl = await redis.ttl(rkey);
    const resetAt = Date.now() + (ttl > 0 ? ttl * 1000 : windowMs);
    const remaining = Math.max(0, max - count);
    const allowed = count <= max;
    return { allowed, remaining, resetAt, distributed: true };
  } catch {
    const r = checkRateLimit(key, options);
    return { ...r, distributed: false };
  }
}

export function getRateLimitHeadersFromResult(result: RateLimitResult): Record<string, string> {
  return getRateLimitHeaders({ remaining: result.remaining, resetAt: result.resetAt });
}

const BLOCK_PREFIX = "rlblock:";

function abuseBlockKey(ipKey: string): string {
  return `${BLOCK_PREFIX}${ipKey}`;
}

/**
 * When `RATE_LIMIT_IP_BLOCK=1` and Redis is configured, temporarily block an IP after
 * a 429 on high-risk routes (e.g. login). TTL from `RATE_LIMIT_BLOCK_SECONDS` (default 900).
 */
export async function maybeBlockIpAfterRateLimitDenied(ipFingerprint: string): Promise<void> {
  if (process.env.RATE_LIMIT_IP_BLOCK !== "1") return;
  const redis = await getRedisClient();
  if (!redis) return;
  const sec = Math.min(
    86_400,
    Math.max(60, Number.parseInt(process.env.RATE_LIMIT_BLOCK_SECONDS ?? "900", 10) || 900)
  );
  const k = abuseBlockKey(ipFingerprint);
  await redis.set(k, "1", { ex: sec });
}

export async function isIpRateLimitBlocked(ipFingerprint: string): Promise<boolean> {
  if (process.env.RATE_LIMIT_IP_BLOCK !== "1") return false;
  const redis = await getRedisClient();
  if (!redis) return false;
  const v = await redis.get(abuseBlockKey(ipFingerprint));
  return v === "1";
}
