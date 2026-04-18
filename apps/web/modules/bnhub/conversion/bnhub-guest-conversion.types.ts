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
  /** bookingsCompleted / max(views, 1) */
  bookingRate: number;
};

export type BNHubConversionInsightType =
  | "low_ctr"
  | "low_view_rate"
  | "low_booking_rate"
  | "friction_detected"
  | "strong_performance";

export type BNHubConversionInsight = {
  id: string;
  type: BNHubConversionInsightType;
  title: string;
  description: string;
  severity: "low" | "medium" | "high";
};

export type BNHubListingConversionSummaryV1 = {
  listingId: string;
  metrics: BNHubConversionMetrics;
  insights: BNHubConversionInsight[];
  /** Top 3 advisory strings */
  recommendations: string[];
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
  };
  funnel: {
    clickToView: number | null;
    viewToBookingStart: number | null;
    startToCompleted: number | null;
  };
  topByBookings: { listingId: string; title: string | null; city: string | null; count: number }[];
  weakestByViews: { listingId: string; title: string | null; city: string | null; views: number; completed: number }[];
};
