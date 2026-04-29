/** BNHub host conversion insights (dashboard UI + server engine). */

export type ListingConversionRecommendation = {
  listingId: string;
  type: string;
  summary: string;
  priority: string;
  reasons: string[];
};

export type ListingConversionMetrics = {
  listingViews: number;
  bookingStarts: number;
  bookingsCompleted: number;
  conversionRate: number | null;
  bookingStartRate: number | null;
  abandonmentRate: number | null;
  lowConversion: boolean;
  explanation: string;
};

export type ListingConversionInsight = {
  listingId: string;
  title: string;
  metrics: ListingConversionMetrics;
  recommendations: ListingConversionRecommendation[];
  decisionSuppressed?: boolean;
  decisionSuppressionReason?: string | null;
  trustRankingBoostApplied?: boolean;
  trustRankingBoostNote?: string | null;
};
