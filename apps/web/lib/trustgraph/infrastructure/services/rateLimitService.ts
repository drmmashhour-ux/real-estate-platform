import { getPhase8PlatformConfig } from "@/lib/trustgraph/config/phase8-platform";
import { recordPlatformEvent } from "@/lib/observability";

type Bucket = { timestamps: number[] };

const buckets = new Map<string, Bucket>();

export function checkRateLimit(keyId: string, maxPerMinute: number): { allowed: boolean; retryAfterSec?: number } {
  const cfg = getPhase8PlatformConfig();
  const windowMs = cfg.rateLimit.windowSeconds * 1000;
  const now = Date.now();
  const b = buckets.get(keyId) ?? { timestamps: [] };
  const cutoff = now - windowMs;
  b.timestamps = b.timestamps.filter((t) => t > cutoff);
  if (b.timestamps.length >= maxPerMinute) {
    const oldest = b.timestamps[0] ?? now;
    const retryAfterSec = Math.ceil((oldest + windowMs - now) / 1000);
    void recordPlatformEvent({
      eventType: "trustgraph_rate_limit_block",
      sourceModule: "trustgraph",
      entityType: "API_KEY",
      entityId: keyId,
      payload: { maxPerMinute },
    }).catch(() => {});
    return { allowed: false, retryAfterSec: Math.max(1, retryAfterSec) };
  }
  b.timestamps.push(now);
  buckets.set(keyId, b);
  return { allowed: true };
}
