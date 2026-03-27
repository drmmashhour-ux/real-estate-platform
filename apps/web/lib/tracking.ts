/**
 * LECIPM ads & funnel tracking — client-side beacons to /api/analytics/track.
 * Attribution (source/campaign/medium) comes from the first-touch cookie set by middleware.
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
  /** Legacy alias — still accepted server-side for older clients */
  CTA_CLICK_LEGACY: "cta_click",
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

/**
 * Fire-and-forget event. Uses `keepalive` so clicks/nav still send.
 */
export function track(eventType: string, extra?: TrackOptions): void {
  if (typeof window === "undefined") return;
  const path =
    extra?.path ?? `${window.location.pathname}${window.location.search}`;
  const sessionId = getTrackingSessionId();
  const body = JSON.stringify({
    eventType,
    path: path.slice(0, 2048),
    sessionId,
    meta: extra?.meta ?? undefined,
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
  void import("@/modules/analytics/services/gtag").then(({ gtagReportEvent }) => {
    if (eventType === TrackingEvent.PAGE_VIEW) return;
    gtagReportEvent(eventType, (extra?.meta ?? {}) as Record<string, unknown>);
  });
  void import("@/modules/analytics/services/meta-pixel").then(({ fbqReportEvent }) => {
    if (eventType === TrackingEvent.PAGE_VIEW) return;
    fbqReportEvent(eventType, (extra?.meta ?? {}) as Record<string, unknown>);
  });
}

export function trackPageView(overridePath?: string): void {
  track(TrackingEvent.PAGE_VIEW, {
    path: overridePath,
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
