import { getPlatformMetrics, type PlatformMetrics } from "./metrics";

let cache: PlatformMetrics | null = null;
let expires = 0;
const DEFAULT_TTL_MS = 30_000;

/**
 * 30s in-process cache for `getPlatformMetrics` (per Node) — lower DB load for dashboards and polling.
 */
export async function getCachedMetrics(): Promise<PlatformMetrics> {
  if (Date.now() < expires && cache) {
    return cache;
  }
  const data = await getPlatformMetrics();
  cache = data;
  expires = Date.now() + DEFAULT_TTL_MS;
  return data;
}
