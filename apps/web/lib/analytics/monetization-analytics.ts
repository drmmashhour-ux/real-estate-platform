import { trackFunnelEvent } from "@/lib/funnel/tracker";

/** Pricing snapshot API read (server) — fire sparingly; prefer client page events for impressions. */
export function trackMonetizationPricingSnapshotRead(meta: Record<string, unknown>) {
  void trackFunnelEvent("monetization_pricing_snapshot_read", meta);
}

export function trackMonetizationCheckoutSessionCreated(meta: Record<string, unknown>) {
  void trackFunnelEvent("monetization_checkout_session_created", meta);
}

export function trackMonetizationSubscriptionCheckoutStarted(meta: Record<string, unknown>) {
  void trackFunnelEvent("monetization_subscription_checkout_started", meta);
}

export function trackMonetizationEngineCalculate(meta: Record<string, unknown>) {
  void trackFunnelEvent("monetization_pricing_engine_calculate", meta);
}
