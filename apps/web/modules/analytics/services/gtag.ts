/**
 * Google Analytics 4 bridge (client-only). Loaded by GoogleAnalyticsLoader when
 * NEXT_PUBLIC_GA_MEASUREMENT_ID is set.
 */

export const GA_MEASUREMENT_ID =
  typeof process !== "undefined" ? process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() ?? "" : "";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function gtagReportEvent(eventName: string, eventParams?: Record<string, unknown>): void {
  if (typeof window === "undefined" || !window.gtag) return;
  try {
    window.gtag("event", eventName, eventParams ?? {});
  } catch {
    /* ignore */
  }
}

export function gtagPageView(pagePath: string): void {
  if (typeof window === "undefined" || !GA_MEASUREMENT_ID || !window.gtag) return;
  try {
    window.gtag("config", GA_MEASUREMENT_ID, { page_path: pagePath });
  } catch {
    /* ignore */
  }
}
