/** In-memory cache only — enable `FEATURE_MOBILE_OFFLINE_CACHE_V1` + AsyncStorage for persistence later. */
const mem = new Map<string, string>();

export function offlineCacheSet(key: string, value: string) {
  mem.set(key, value);
}

export function offlineCacheGet(key: string): string | undefined {
  return mem.get(key);
}

export function offlineCacheClearPrefix(prefix: string) {
  for (const k of mem.keys()) {
    if (k.startsWith(prefix)) mem.delete(k);
  }
}
