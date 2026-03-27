export const META_PIXEL_ID =
  typeof process !== "undefined" ? process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() ?? "" : "";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export function fbqReportEvent(eventName: string, payload?: Record<string, unknown>): void {
  if (typeof window === "undefined" || !window.fbq) return;
  try {
    window.fbq("trackCustom", eventName, payload ?? {});
  } catch {
    /* ignore */
  }
}

export function fbqPageView(): void {
  if (typeof window === "undefined" || !window.fbq) return;
  try {
    window.fbq("track", "PageView");
  } catch {
    /* ignore */
  }
}
