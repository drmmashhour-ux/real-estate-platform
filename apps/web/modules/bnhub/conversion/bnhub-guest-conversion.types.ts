/**
 * BNHub guest conversion layer (V1) — advisory types only.
 */

export type BNHubConversionEventType =
  | "search_view"
  | "listing_click"
  | "listing_view"
  | "booking_started"
  | "booking_completed";

export type BNHubConversionMetrics = {
  impressions: number;
  clicks: number;
  views: number;
  bookingStarts: number;
  bookingsCompleted: number;
  /** clicks / max(impressions, 1) */
  ctr: number;
  /** views / max(clicks, 1) */
  viewRate: number;
  /** bookingsCompleted / max(views, 1) — paid completions vs listing views */
  bookingRate: number;
  /** bookingStarts / max(views, 1) — listing → booking start (money lever) */
  viewToStartRate: number;
  /** bookingsCompleted / max(bookingStarts, 1) — start → paid */
  startToPaidRate: number;
};

export type BNHubConversionInsightType =
  | "low_ctr"
  | "low_view_rate"
  | "low_booking_rate"
  | "low_booking_start_rate"
  | "friction_detected"
  | "strong_performance";

export type BNHubConversionInsight = {
  id: string;
  type: BNHubConversionInsightType;
  title: string;
  description: string;
  severity: "low" | "medium" | "high";
};

export type BnhubWeakestFunnelStep =
  | "search_click"
  | "click_view"
  | "view_start"
  | "start_paid"
  | null;

export type BNHubListingConversionSummaryV1 = {
  listingId: string;
  metrics: BNHubConversionMetrics;
  insights: BNHubConversionInsight[];
  /** Top 3 advisory strings */
  recommendations: string[];
  /** Highest-loss funnel stage for this window (rule-based). */
  weakestStep: BnhubWeakestFunnelStep;
  weakestStepLabel: string | null;
  /** Estimated drop-off at weakest step (0–1), from real counts + volume guards; null if not enough volume. */
  dropOffAtWeakestStep: number | null;
  /** Single-line diagnosis for hosts (from analyzer insight title or weakest-step mapping). */
  issueLabel: string | null;
  /** Single prioritized issue for host attention */
  biggestIssue: BNHubConversionInsight | null;
  /** Rule-based host fixes (photos, price, copy) */
  quickWins: string[];
  /** Host-dashboard alerts */
  alerts: { code: string; message: string; severity: "warn" | "critical" }[];
  /** Both FEATURE_BNHUB_CONVERSION_V1 and NEXT_PUBLIC_FEATURE_BNHUB_CONVERSION_V1 must be on for aligned signals */
  trackingParity: { serverUi: boolean; clientBeacon: boolean; aligned: boolean };
  createdAt: string;
};

/** Admin marketplace rollup (derived from `AiConversionSignal`). */
export type BNHubConversionAdminOverview = {
  generatedAt: string;
  windowDays: number;
  totals: {
    listingClicks: number;
    listingViews: number;
    bookingStarted: number;
    bookingCompleted: number;
    searchViews: number;
  };
  funnel: {
    clickToView: number | null;
    viewToBookingStart: number | null;
    startToCompleted: number | null;
    searchToClick: number | null;
  };
  /** Marketplace-wide weakest funnel step from aggregated counts (volume guards inside analyzer). */
  globalDropOff: {
    weakestStep: BnhubWeakestFunnelStep;
    weakestStepLabel: string | null;
    dropOffRate: number | null;
  } | null;
  /** Prior vs current window of equal length — real signals only (no new tracking instrumentation). */
  measurementComparison: {
    previousWindowLabel: string;
    previous: {
      searchToClick: number | null;
      clickToView: number | null;
      viewToBookingStart: number | null;
      startToCompleted: number | null;
    };
    deltaPercentagePoints: {
      searchToClick: number | null;
      clickToView: number | null;
      viewToBookingStart: number | null;
      startToCompleted: number | null;
    };
  };
  topByBookings: { listingId: string; title: string | null; city: string | null; count: number }[];
  weakestByViews: { listingId: string; title: string | null; city: string | null; views: number; completed: number }[];
  /** Per-listing funnel slice for operators (volume thresholds inside builder). */
  listingFunnelRows: BNHubListingFunnelAdminRow[];
};

/** One row per listing — counts + derived rates + weakest step (rule-based). */
export type BNHubListingFunnelAdminRow = {
  listingId: string;
  title: string | null;
  city: string | null;
  searchViews: number;
  clicks: number;
  listingViews: number;
  bookingStarts: number;
  bookingsCompleted: number;
  /** clicks / search impressions */
  clickRate: number;
  /** listing views / clicks */
  listingViewRate: number;
  /** booking starts / listing views */
  startRate: number;
  /** paid completions / booking starts */
  completionRate: number;
  weakestStep: BnhubWeakestFunnelStep;
  weakestStepLabel: string | null;
  /** Drop-off fraction at weakest step (0–1), when volume guards pass. */
  dropOffRate: number | null;
};
