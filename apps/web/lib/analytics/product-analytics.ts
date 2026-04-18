/**
 * Unified client-side product analytics: PostHog (optional) + GA4 + Plausible (optional).
 * Safe no-ops when keys / domain are unset.
 *
 * BNHUB `booking_click` (Reserve) is sent via `track()` in `lib/tracking.ts` → Meta `AddToCart`, not here.
 */

import posthog, { initPosthog } from "@/lib/posthogClient";
import { gtagReportEvent } from "@/modules/analytics/services/gtag";
import { ProductAnalyticsEvents, type ProductAnalyticsEventName } from "@/lib/analytics/product-events";
import { trackServerAnalytics } from "@/lib/tracking";
import { reportGoogleAdsBookingConversion } from "@/modules/analytics/services/google-ads-conversions";

export { ProductAnalyticsEvents, type ProductAnalyticsEventName } from "@/lib/analytics/product-events";

export const PLAUSIBLE_DOMAIN =
  typeof process !== "undefined" ? process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN?.trim() ?? "" : "";

declare global {
  interface Window {
    plausible?: (
      eventName: string,
      options?: { props?: Record<string, unknown>; u?: string }
    ) => void;
  }
}

function reportPlausible(eventName: string, properties?: Record<string, unknown>): void {
  if (typeof window === "undefined" || !PLAUSIBLE_DOMAIN) return;
  try {
    const w = window.plausible;
    if (!w) return;
    const props = properties && Object.keys(properties).length > 0 ? properties : undefined;
    w(eventName, props ? { props } : undefined);
  } catch {
    /* ignore */
  }
}

/**
 * Send the same event to PostHog, GA4, and Plausible (when configured).
 * Use for funnel events (`booking_*`, `listing_viewed`, `search_usage`).
 */
function syncFirstPartyTraffic(name: string, properties?: Record<string, unknown>): void {
  const meta = properties && typeof properties === "object" ? properties : undefined;
  if (name === ProductAnalyticsEvents.BOOKING_STARTED) {
    trackServerAnalytics("booking_started", { meta });
    return;
  }
  if (name === ProductAnalyticsEvents.BOOKING_COMPLETED) {
    trackServerAnalytics("booking_completed", { meta });
    const pay =
      meta && typeof meta.payment_confirmed === "boolean" ? meta.payment_confirmed : false;
    const bookingId =
      meta && typeof meta.booking_id === "string" ? meta.booking_id.trim() : undefined;
    const valueCents =
      meta && typeof meta.value_cents === "number" && Number.isFinite(meta.value_cents)
        ? meta.value_cents
        : null;
    if (pay) {
      reportGoogleAdsBookingConversion({ bookingId, valueCents });
    }
    return;
  }
  if (name === ProductAnalyticsEvents.LISTING_VIEWED) {
    trackServerAnalytics("listing_view", { meta });
  }
}

export function reportProductEvent(
  name: ProductAnalyticsEventName | string,
  properties?: Record<string, unknown>
): void {
  if (typeof window === "undefined") return;

  syncFirstPartyTraffic(name, properties);

  try {
    if (process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim()) {
      initPosthog();
      posthog.capture(name, properties);
    }
  } catch {
    /* ignore */
  }

  try {
    gtagReportEvent(name, properties);
  } catch {
    /* ignore */
  }

  void import("@/modules/analytics/services/meta-pixel").then((m) => {
    if (name === ProductAnalyticsEvents.LISTING_VIEWED) {
      m.metaPixelTrackViewContent(properties);
    } else if (name === ProductAnalyticsEvents.BOOKING_STARTED) {
      m.metaPixelTrackInitiateCheckout(properties);
    } else if (name === ProductAnalyticsEvents.BOOKING_COMPLETED) {
      m.metaPixelTrackPurchase(properties);
    }
  });

  reportPlausible(name, properties);
}
