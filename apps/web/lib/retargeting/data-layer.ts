/**
 * Future-ready retargeting: push structured payloads to dataLayer for Meta / Ads
 * when those tags are added. Safe no-op if window.dataLayer missing.
 */
export function pushRetargetingPayload(event: string, payload: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  const w = window as Window & { dataLayer?: unknown[] };
  w.dataLayer = w.dataLayer || [];
  try {
    w.dataLayer.push({ event, ...payload });
  } catch {
    /* ignore */
  }
}
