/**
 * BNHUB guest conversion optimizer — honest, signal-based suggestions only.
 */

export type ConversionEventType =
  | "listing_view"
  | "listing_click"
  | "booking_started"
  | "booking_completed"
  | "booking_abandoned"
  | "message_sent_to_host"
  | "message_response_received";

export type ConversionRecommendationType =
  | "title_clarity"
  | "description_depth"
  | "photo_coverage"
  | "pricing_review"
  | "reduce_friction"
  | "trust_signal_boost";

export type ConversionRecommendationPriority = "low" | "medium" | "high";

export type ConversionRecommendation = {
  type: ConversionRecommendationType;
  listingId: string;
  summary: string;
  reasons: string[];
  priority: ConversionRecommendationPriority;
};

export type ListingConversionMetrics = {
  listingId: string;
  /** Denominator for primary rate; may be 0 */
  listingViews: number;
  listingClicks: number;
  bookingStarts: number;
  bookingsCompleted: number;
  bookingsAbandoned: number;
  messagesToHost: number;
  hostMessageResponses: number;
  /** bookings_completed / max(listing_views, 1) — null if insufficient views */
  conversionRate: number | null;
  /** booking starts / max(views, 1) */
  bookingStartRate: number | null;
  /** abandoned / max(booking starts, 1) */
  abandonmentRate: number | null;
  /** True when views meet minimum and rate is below threshold */
  lowConversion: boolean;
  /** Enough views to interpret rates */
  sufficientData: boolean;
  /** Plain-language note for hosts */
  explanation: string;
};

export type ListingConversionInsight = {
  listingId: string;
  title: string;
  metrics: ListingConversionMetrics;
  recommendations: ConversionRecommendation[];
  trustRankingBoostApplied: boolean;
  trustRankingBoostNote: string | null;
  decisionSuppressed: boolean;
  decisionSuppressionReason: string | null;
};
