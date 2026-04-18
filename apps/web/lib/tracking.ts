import { getClientTrafficAttributionMeta } from "@/lib/attribution/social-traffic";

/**
 * LECIPM ads & funnel tracking — client-side beacons to /api/analytics/track.
 * Attribution (utm_*, social_source) comes from the first-touch cookie (middleware) plus current URL;
 * `social_source` is also stored in sessionStorage for the tab.
 */

export const TRACKING_SESSION_KEY = "lecipm_traffic_session";

/** Event names stored in TrafficEvent.event_type */
export const TrackingEvent = {
  PAGE_VIEW: "page_view",
  EVALUATION_STARTED: "evaluation_started",
  EVALUATION_SUBMITTED: "evaluation_submitted",
  CTA_CLICKED: "CTA_clicked",
  CALL_CLICKED: "call_clicked",
  WHATSAPP_CLICKED: "whatsapp_clicked",
  /** BNHUB stay funnel — primary CTA (Reserve, See availability, sticky). Stored as `TrafficEvent.event_type`. */
  CTA_CLICK: "cta_click",
  /** User clicked through to /analyze (e.g. from homepage or Wix) — legacy; prefer CTA / RUN below */
  INVESTMENT_ANALYZE_CLICK: "investment_analyze_click",
  /** Homepage / nav “Start analysis” — funnel: visit → analyze intent */
  INVESTMENT_ANALYZE_CTA_CLICK: "investment_analyze_cta_click",
  /** User ran “Analyze deal” on the analyzer form */
  INVESTMENT_ANALYZE_RUN: "investment_analyze_run",
  /** Opened investment portfolio (live or demo dashboard) */
  INVESTMENT_DASHBOARD_VISIT: "investment_dashboard_visit",
  /** Lightweight session flow step (path / step name) — no third-party replay */
  INVESTMENT_FUNNEL_STEP: "investment_funnel_step",
  /** Micro yes/no helpful signal after key actions */
  MICRO_FEEDBACK_HELPFUL: "micro_feedback_helpful",
  /** Saved deal (demo localStorage or API) */
  INVESTMENT_DEAL_SAVED: "investment_deal_saved",
  /** User compared 2+ deals (selection ready) */
  INVESTMENT_COMPARE_USED: "investment_compare_used",
  /** Second+ navigation in same browser session (engagement) */
  INVESTMENT_RETURN_VISIT: "investment_return_visit",
  /** Waitlist email captured */
  GROWTH_WAITLIST_SIGNUP: "growth_waitlist_signup",
  /** Public shared deal page (/deal/[id]) */
  SHARED_DEAL_PAGE_VIEW: "shared_deal_page_view",
  SHARED_DEAL_ANALYZE_CLICK: "shared_deal_analyze_click",
  SHARED_DEAL_WAITLIST_EMAIL: "shared_deal_waitlist_email",
  /** Native share or clipboard — public deal link */
  SHARE_DEAL_CLICKED: "share_deal_clicked",
  /** Copy incentive after analysis (deal or analyzer link) */
  INVESTMENT_SHARE_COPY_AFTER_ANALYSIS: "investment_share_copy_after_analysis",
  /** Free plan save blocked — at deal limit */
  INVESTMENT_PLAN_LIMIT_HIT: "investment_plan_limit_hit",
  /** User clicked Upgrade to Pro (mock funnel) */
  INVESTMENT_UPGRADE_CLICK: "investment_upgrade_click",
  SIGNUP_COMPLETED: "signup_completed",
  ANALYSIS_EVENT: "analysis_event",
  LEAD_PURCHASED: "lead_purchased",
  SUBSCRIPTION_PURCHASED: "subscription_purchased",
  LEAD_CHECKOUT_STARTED: "lead_checkout_started",
  SUBSCRIPTION_CHECKOUT_STARTED: "subscription_checkout_started",
  /** Paid/organic ad click-through landed on listing URL (UTM present); pairs with `listing_view`. */
  AD_CLICK: "ad_click",
  /** Guest scrolled ≥50% of page height (engagement / drop-off signal). */
  SCROLL_50: "scroll_50",
  /** Clicked a listing card/link (BNHUB stays, unified listings). */
  LISTING_CLICK: "listing_click",
  /** Primary booking CTA — guest submitted the stay booking form (before checkout session). */
  BOOKING_CLICK: "booking_click",
  /** Checkout session created or booking placed (synced with product `booking_started`). */
  BOOKING_STARTED: "booking_started",
  /** Payment/booking confirmed (synced with product `booking_completed`). */
  BOOKING_COMPLETED: "booking_completed",
  /** Product search submitted (home, search, BNHub). */
  SEARCH: "search",
} as const;

export type TrackingEventType =
  (typeof TrackingEvent)[keyof typeof TrackingEvent];

export function getTrackingSessionId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    let s = window.sessionStorage.getItem(TRACKING_SESSION_KEY);
    if (!s) {
      s =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      window.sessionStorage.setItem(TRACKING_SESSION_KEY, s);
    }
    return s;
  } catch {
    return null;
  }
}

export type TrackOptions = {
  path?: string;
  /** Shown in admin "heat" — e.g. ctaKind, label, leadId */
  meta?: Record<string, unknown>;
};

const TRAFFIC_ATTRIBUTION_EVENTS = new Set([
  "ad_click",
  "listing_view",
  "scroll_50",
  "cta_click",
  "booking_started",
  "booking_completed",
  "booking_click",
  "listing_click",
  "host_signup",
  "broker_lead",
  "search",
]);

/**
 * Fire-and-forget event. Uses `keepalive` so clicks/nav still send.
 */
/**
 * Record a `TrafficEvent` only (no GA / Meta / Plausible) — use when the same user action
 * is already reported to third parties elsewhere (e.g. `reportProductEvent`).
 */
export function trackServerAnalytics(eventType: string, extra?: TrackOptions): void {
  if (typeof window === "undefined") return;
  const path =
    extra?.path ?? `${window.location.pathname}${window.location.search}`;
  const sessionId = getTrackingSessionId();
  let meta = extra?.meta ?? undefined;
  if (TRAFFIC_ATTRIBUTION_EVENTS.has(eventType) && meta && typeof meta === "object" && !Array.isArray(meta)) {
    const attr = getClientTrafficAttributionMeta() as Record<string, unknown>;
    meta = { ...attr, ...meta };
  } else if (TRAFFIC_ATTRIBUTION_EVENTS.has(eventType)) {
    meta = getClientTrafficAttributionMeta() as Record<string, unknown>;
  }
  const body = JSON.stringify({
    eventType,
    path: path.slice(0, 2048),
    sessionId,
    meta,
  });
  try {
    void fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    });
  } catch {
    /* ignore */
  }
}

export function track(eventType: string, extra?: TrackOptions): void {
  trackServerAnalytics(eventType, extra);
  void import("@/modules/analytics/services/gtag").then(({ gtagReportEvent }) => {
    if (eventType === TrackingEvent.PAGE_VIEW) return;
    gtagReportEvent(eventType, (extra?.meta ?? {}) as Record<string, unknown>);
  });
  void import("@/modules/analytics/services/meta-pixel").then((m) => {
    if (eventType === TrackingEvent.PAGE_VIEW) return;
    const payload = (extra?.meta ?? {}) as Record<string, unknown>;
    if (eventType === "listing_view") {
      m.metaPixelTrackViewContent(payload);
      return;
    }
    if (eventType === "booking_click") {
      m.metaPixelTrackAddToCart(payload);
      return;
    }
    if (eventType === "booking_started") {
      m.metaPixelTrackInitiateCheckout(payload);
      return;
    }
    if (eventType === "booking_completed") {
      m.metaPixelTrackPurchase(payload);
      return;
    }
    m.fbqReportEvent(eventType, payload);
  });
}

export function trackPageView(overridePath?: string, meta?: Record<string, unknown>): void {
  track(TrackingEvent.PAGE_VIEW, {
    path: overridePath,
    ...(meta && Object.keys(meta).length > 0 ? { meta } : {}),
  });
  const p =
    overridePath ??
    (typeof window !== "undefined"
      ? `${window.location.pathname}${window.location.search}`
      : "");
  void import("@/modules/analytics/services/gtag").then(({ gtagPageView }) => {
    gtagPageView(p);
  });
  void import("@/modules/analytics/services/meta-pixel").then(({ fbqPageView }) => {
    fbqPageView();
  });
}
