/**
 * ORDER SYBNB-93 — max anonymous quick-listings per client IP per UTC calendar day (in-process).
 * Multi-instance deployments should replace with shared store (Redis) + optional DB audit.
 */
const MAX_ANONYMOUS_LISTINGS_PER_IP_PER_DAY = 3;

type Bucket = { day: string; count: number };

const buckets = new Map<string, Bucket>();

function utcDayString(now = Date.now()): string {
  return new Date(now).toISOString().slice(0, 10);
}

function pruneStale(ip: string, nowDay: string) {
  const b = buckets.get(ip);
  if (b && b.day !== nowDay) {
    buckets.delete(ip);
  }
}

/** Returns false when this IP has reached the daily anonymous posting cap. */
export function consumeAnonymousListingIpSlot(ip: string): boolean {
  const trimmed = ip.trim();
  if (!trimmed) return false;
  const day = utcDayString();
  pruneStale(trimmed, day);
  let b = buckets.get(trimmed);
  if (!b || b.day !== day) {
    b = { day, count: 0 };
    buckets.set(trimmed, b);
  }
  if (b.count >= MAX_ANONYMOUS_LISTINGS_PER_IP_PER_DAY) {
    return false;
  }
  b.count += 1;
  return true;
}
