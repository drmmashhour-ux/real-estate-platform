/**
 * Order 77 — small in-process TTL cache for hot read paths (per-instance; cleared on deploy).
 * For multi-instance / shared cache see `lib/redis.ts` and {@link getCacheOrRedis}.
 */

import { redisGet, redisSet } from "./redis";

type CacheEntry = {
  data: unknown;
  expires: number;
};

const store = new Map<string, CacheEntry>();

export function getCache(key: string): unknown | null {
  const entry = store.get(key);
  if (!entry) return null;

  if (Date.now() > entry.expires) {
    store.delete(key);
    return null;
  }

  return entry.data;
}

export function setCache(key: string, data: unknown, ttlMs = 10_000) {
  store.set(key, {
    data,
    expires: Date.now() + ttlMs,
  });
}

/**
 * Order 78 — try Redis first (shared across instances), then in-memory (Order 77).
 */
export async function getCacheOrRedis(key: string): Promise<unknown | null> {
  const fromRedis = await redisGet(key);
  if (fromRedis != null) return fromRedis;
  return getCache(key);
}

/** Writes both layers: `ttlMs` for memory, Redis `EX` in whole seconds (min 1). */
export async function setCacheAndRedis(key: string, data: unknown, ttlMs = 10_000) {
  setCache(key, data, ttlMs);
  const sec = Math.max(1, Math.ceil(ttlMs / 1000));
  await redisSet(key, data, sec);
}
