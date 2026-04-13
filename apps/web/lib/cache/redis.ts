/**
 * Optional Redis caching. No-op if REDIS_URL is not set.
 * Use for: session cache, search result cache, rate limit state at scale.
 */

const REDIS_URL = process.env.REDIS_URL;

export type RedisClient = {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string, options?: { ex?: number }) => Promise<void>;
  del: (key: string) => Promise<void>;
  /** INCR key; set TTL (seconds) when count becomes 1. Returns new count. */
  incrWithExpire: (key: string, windowSeconds: number) => Promise<number>;
  ttl: (key: string) => Promise<number>;
};

let client: RedisClient | null = null;

/** Shared Redis client for cache and distributed rate limits. */
export async function getRedisClient(): Promise<RedisClient | null> {
  if (!REDIS_URL) return null;
  if (client) return client;
  try {
    // Dynamic import so app works without redis package
    const ioredisMod = await import("ioredis");
    const RedisCtor = (ioredisMod as any).default ?? ioredisMod;
    const redis = new RedisCtor(REDIS_URL);
    client = {
      async get(key: string) {
        return redis.get(key);
      },
      async set(key: string, value: string, options?: { ex?: number }) {
        if (options?.ex) await redis.setex(key, options.ex, value);
        else await redis.set(key, value);
      },
      async del(key: string) {
        await redis.del(key);
      },
      async incrWithExpire(key: string, windowSeconds: number) {
        const n = await redis.incr(key);
        if (n === 1) await redis.expire(key, Math.max(1, windowSeconds));
        return Number(n);
      },
      async ttl(key: string) {
        return redis.ttl(key);
      },
    };
    return client;
  } catch {
    return null;
  }
}

/**
 * Get a cached string. Returns null if Redis not configured or key missing.
 */
export async function cacheGet(key: string): Promise<string | null> {
  const c = await getRedisClient();
  if (!c) return null;
  return c.get(key);
}

/**
 * Set a cached string. TTL optional (seconds). No-op if Redis not configured.
 */
export async function cacheSet(key: string, value: string, ttlSeconds?: number): Promise<void> {
  const c = await getRedisClient();
  if (!c) return;
  await c.set(key, value, ttlSeconds ? { ex: ttlSeconds } : undefined);
}

/**
 * Delete a key. No-op if Redis not configured.
 */
export async function cacheDel(key: string): Promise<void> {
  const c = await getRedisClient();
  if (!c) return;
  await c.del(key);
}

export function isRedisConfigured(): boolean {
  return Boolean(REDIS_URL);
}

/** Fire-and-forget pub/sub (e.g. optional Socket.IO bridge). Returns false if Redis unavailable. */
export async function redisPublish(channel: string, message: string): Promise<boolean> {
  if (!REDIS_URL) return false;
  try {
    const ioredisMod = await import("ioredis");
    const RedisCtor = (ioredisMod as any).default ?? ioredisMod;
    const redis = new RedisCtor(REDIS_URL);
    await redis.publish(channel, message);
    redis.disconnect();
    return true;
  } catch {
    return false;
  }
}
