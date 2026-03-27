import posthog, { initPosthog } from "@/lib/posthogClient";

/** Client-side product events — no-op when PostHog is not configured or not initialized. */
export function trackEvent(name: string, properties?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim()) return;
  try {
    initPosthog();
    posthog.capture(name, properties);
  } catch {
    /* ignore */
  }
}
