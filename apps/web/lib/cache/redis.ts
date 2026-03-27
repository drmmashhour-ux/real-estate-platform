/**
 * Optional Redis caching. No-op if REDIS_URL is not set.
 * Use for: session cache, search result cache, rate limit state at scale.
 */

const REDIS_URL = process.env.REDIS_URL;

export type RedisClient = {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string, options?: { ex?: number }) => Promise<void>;
  del: (key: string) => Promise<void>;
};

let client: RedisClient | null = null;

async function getClient(): Promise<RedisClient | null> {
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
  const c = await getClient();
  if (!c) return null;
  return c.get(key);
}

/**
 * Set a cached string. TTL optional (seconds). No-op if Redis not configured.
 */
export async function cacheSet(key: string, value: string, ttlSeconds?: number): Promise<void> {
  const c = await getClient();
  if (!c) return;
  await c.set(key, value, ttlSeconds ? { ex: ttlSeconds } : undefined);
}

/**
 * Delete a key. No-op if Redis not configured.
 */
export async function cacheDel(key: string): Promise<void> {
  const c = await getClient();
  if (!c) return;
  await c.del(key);
}

export function isRedisConfigured(): boolean {
  return Boolean(REDIS_URL);
}
