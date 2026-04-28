/**
 * ORDER SYBNB-97 — max listing inquiry messages per client IP per UTC day (in-process).
 * Mirrors `anonymous-listing-ip-limit`; multi-instance deployments should use shared storage.
 */
const MAX_MESSAGES_PER_IP_PER_DAY = 10;

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

/** Returns false when this IP has reached the daily message cap. */
export function consumeListingMessageIpSlot(ip: string): boolean {
  const trimmed = ip.trim();
  if (!trimmed) return false;
  const day = utcDayString();
  pruneStale(trimmed, day);
  let b = buckets.get(trimmed);
  if (!b || b.day !== day) {
    b = { day, count: 0 };
    buckets.set(trimmed, b);
  }
  if (b.count >= MAX_MESSAGES_PER_IP_PER_DAY) {
    return false;
  }
  b.count += 1;
  return true;
}
