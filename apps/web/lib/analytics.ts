import posthog, { initPosthog } from "@/lib/posthogClient";
import { reportProductEvent } from "@/lib/analytics/product-analytics";
import { ProductAnalyticsEvents } from "@/lib/analytics/product-events";

/** Call after a successful login/session so funnels tie to the same person. */
export function identifyUser(user: { id: string; email?: string }): void {
  if (typeof window === "undefined") return;
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim()) return;
  if (!user.id?.trim()) return;
  try {
    initPosthog();
    posthog.identify(user.id, user.email ? { email: user.email } : {});
  } catch {
    /* ignore */
  }
}

/**
 * Marketing / landing analytics — thin wrapper over `reportProductEvent` (client-safe).
 * Server components should not import tracking here; use `trackFunnelEvent` from server actions when needed.
 *
 * Stable event names (GA4 / PostHog / Plausible):
 * - `hero_cta_click` — primary/secondary hero CTAs and section-branded search CTAs
 * - `roi_cta_click` — ROI calculator / host economics entry points
 * - `onboarding_cta_click` — host funnel entry (`/hosts/onboarding`, …)
 * - `pricing_view` — pricing strip scrolled into view (`PricingSectionClient`)
 * - `scroll_depth` — 25 / 50 / 75 / 100% (`LandingScrollDepth`)
 */
export const MarketingAnalyticsEvents = {
  heroCta: ProductAnalyticsEvents.LANDING_HERO_CTA,
  roiCta: ProductAnalyticsEvents.LANDING_ROI_CTA,
  onboardingCta: ProductAnalyticsEvents.LANDING_ONBOARDING_CTA,
  pricingView: ProductAnalyticsEvents.LANDING_PRICING_VIEW,
  scrollDepth: ProductAnalyticsEvents.LANDING_SCROLL_DEPTH,
} as const;

export function trackMarketingEvent(
  event: (typeof MarketingAnalyticsEvents)[keyof typeof MarketingAnalyticsEvents] | string,
  properties?: Record<string, unknown>,
): void {
  reportProductEvent(event, properties);
}
