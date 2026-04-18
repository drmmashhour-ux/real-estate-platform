/**
 * Primary client entry: posts to `tracking-service` ingest URL → `traffic_events` + allowlisted `growth_events`.
 * `signup` fires Google Ads tag only; DB signup rows come from `/api/auth/register`.
 */

import { track, trackPageView, TrackingEvent, type TrackOptions } from "../tracking";
import type { TrackingMetadata } from "./tracking-types";

export const GrowthTrackEvent = {
  PAGE_VIEW: "page_view",
  /** Client-only Google Ads conversion ping after verified `/api/auth/register` success. */
  SIGNUP: "signup",
  BOOKING_STARTED: "booking_started",
  BOOKING_COMPLETED: "booking_completed",
  HOST_SIGNUP: "host_signup",
  BROKER_LEAD: "broker_lead",
} as const;

export function trackEvent(eventName: string, data?: TrackingMetadata): void {
  if (typeof window === "undefined") return;

  if (eventName === GrowthTrackEvent.SIGNUP) {
    void import("@/modules/analytics/services/google-ads-conversions").then((m) =>
      m.reportGoogleAdsSignupConversion()
    );
    return;
  }

  if (eventName === GrowthTrackEvent.PAGE_VIEW || eventName === "page_view") {
    const path = typeof data?.path === "string" ? data.path : undefined;
    const { path: _drop, ...metaRest } = data ?? {};
    trackPageView(path, Object.keys(metaRest).length ? metaRest : undefined);
    return;
  }

  const extra: TrackOptions = {
    meta: data,
    ...(typeof data?.path === "string" ? { path: data.path } : {}),
  };

  const map: Record<string, string> = {
    cta_click: TrackingEvent.CTA_CLICK,
    booking_started: TrackingEvent.BOOKING_STARTED,
    booking_completed: TrackingEvent.BOOKING_COMPLETED,
    search: TrackingEvent.SEARCH,
    host_signup: "host_signup",
    broker_lead: "broker_lead",
  };

  const eventType = map[eventName] ?? eventName;
  track(eventType, extra);
}
