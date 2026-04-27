/**
 * Order 73.2 — in-memory TTL cache for safe, read-only aggregates (no Redis).
 * Do not use for user-specific private data, writes, or payment state.
 */

export type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const cache = new Map<string, CacheEntry<unknown>>();

/**
 * Returns cached value if present and not expired; otherwise runs `loader`, stores result, returns it.
 * On loader failure, if a (possibly expired) entry exists, returns that stale value and logs a warning.
 */
export async function getCached<T>(key: string, ttlSeconds: number, loader: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const existing = cache.get(key) as CacheEntry<T> | undefined;
  if (existing && now < existing.expiresAt) {
    return existing.value;
  }
  try {
    const value = await loader();
    cache.set(key, { value, expiresAt: now + ttlSeconds * 1000 });
    return value;
  } catch (err) {
    if (existing) {
      console.warn("[cache] loader failed; returning stale value", { key, err });
      return existing.value;
    }
    throw err;
  }
}

/** Drop one key, or the entire map when `key` is omitted. */
export function clearCache(key?: string): void {
  if (key == null || key === "") {
    cache.clear();
    return;
  }
  cache.delete(key);
}

export function getCacheStats(): { size: number } {
  return { size: cache.size };
}

/** Stable keys for Order 73.2 docs / invalidation. */
export const CACHE_KEYS = {
  demandHeatmap: "demand:heatmap",
  earlyUsersCount: "early-users:count",
  trustSignals: (cityKey: string) => `trust-signals:${cityKey}`,
  investorMetrics: "investor-metrics",
  launchReadiness: "launch-readiness",
  availability: (listingId: string, start: string, end: string) =>
    `availability:${listingId}:${start}:${end}`,
  /** Order 82.1 — per-user `user_preferences` read cache (getPreferences). */
  prefsUser: (userId: string) => `prefs:${userId}`,
} as const;
