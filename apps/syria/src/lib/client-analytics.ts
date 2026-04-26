/**
 * Fire-and-forget client → `/api/analytics/event` (session optional).
 */
export function trackClientAnalyticsEvent(
  eventType: string,
  opts?: { propertyId?: string; payload?: Record<string, unknown> },
): void {
  void fetch("/api/analytics/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      eventType,
      propertyId: opts?.propertyId,
      ...(opts?.payload && Object.keys(opts.payload).length > 0 ? { payload: opts.payload } : {}),
    }),
  }).catch(() => {
    /* ignore */
  });
}
