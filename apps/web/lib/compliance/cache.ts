export type DsGateCacheValue = { ok: true } | { ok: false; message: string };

const dsCache = new Map<string, { value: DsGateCacheValue; expires: number }>();
const DEFAULT_TTL_MS = 60_000;

/**
 * 60s in-memory cache for OACIQ DS gate results (per Node process) — reduces repeated compliance DB reads.
 */
export function getDSCache(listingId: string): DsGateCacheValue | null {
  const v = dsCache.get(listingId);
  if (!v || Date.now() > v.expires) {
    return null;
  }
  return v.value;
}

export function setDSCache(listingId: string, value: DsGateCacheValue, ttlMs = DEFAULT_TTL_MS): void {
  dsCache.set(listingId, { value, expires: Date.now() + ttlMs });
}
