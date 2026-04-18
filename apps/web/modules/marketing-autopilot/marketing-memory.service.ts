/** In-process hint cache (v1); replace with Redis/DB if multi-instance. */
const lastRun = new Map<string, number>();

export function markAutopilotRun(listingId: string): void {
  lastRun.set(listingId, Date.now());
}

export function secondsSinceLastRun(listingId: string): number | null {
  const t = lastRun.get(listingId);
  if (!t) return null;
  return (Date.now() - t) / 1000;
}
