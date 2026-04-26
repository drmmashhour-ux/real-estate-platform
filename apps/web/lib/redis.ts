/**
 * Order 78 — optional Redis for distributed cache (set `REDIS_URL` in production).
 * When unset, helpers no-op / return null so local dev works without Redis.
 */

import Redis from "ioredis";

let client: Redis | null = null;

function getClient(): Redis | null {
  const url = process.env.REDIS_URL?.trim();
  if (!url) return null;
  if (!client) {
    client = new Redis(url, {
      maxRetriesPerRequest: 2,
      enableReadyCheck: true,
      lazyConnect: false,
    });
  }
  return client;
}

/** Non-null only when `REDIS_URL` is configured (use for feature checks / tests). */
export function isRedisConfigured(): boolean {
  return Boolean(process.env.REDIS_URL?.trim());
}

/** Live client; `null` if `REDIS_URL` is missing — do not call without a guard if you need strict Redis. */
export function getRedis(): Redis | null {
  return getClient();
}

export async function redisGet(key: string): Promise<unknown | null> {
  const r = getClient();
  if (!r) return null;
  try {
    const data = await r.get(key);
    if (data == null) return null;
    return JSON.parse(data) as unknown;
  } catch {
    return null;
  }
}

/** `ttlSeconds` default 10 (per task). */
export async function redisSet(key: string, value: unknown, ttlSeconds = 10): Promise<void> {
  const r = getClient();
  if (!r) return;
  try {
    await r.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch {
    // non-fatal: fall back to in-memory or miss
  }
}
