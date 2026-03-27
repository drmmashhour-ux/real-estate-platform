import { initPosthog } from "@/lib/posthogClient";
import posthog from "@/lib/posthogClient";

/**
 * Client-side analytics for Offer Strategy Simulator presentation modes.
 * No-op when PostHog is not configured.
 */
export function trackOfferStrategyPresentationEvent(
  event:
    | "offer_strategy_presentation_mode_viewed"
    | "offer_strategy_internal_mode_viewed"
    | "offer_strategy_presentation_shared_later_ready",
  props: { listingId: string; strategyMode?: string },
): void {
  if (typeof window === "undefined") return;
  try {
    initPosthog();
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim()) return;
    posthog.capture(event, props);
  } catch {
    /* ignore */
  }
}
