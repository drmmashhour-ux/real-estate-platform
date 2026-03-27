export type WatchlistAlertStatus = "unread" | "read" | "dismissed";

export type WatchlistAlertType =
  | "price_changed"
  | "deal_score_up"
  | "deal_score_down"
  | "trust_score_changed"
  | "fraud_risk_up"
  | "confidence_up"
  | "confidence_down"
  | "listing_status_changed"
  | "strong_opportunity_detected"
  | "needs_review_detected";

export type WatchlistAlertSeverity = "info" | "warning" | "critical";

export type WatchlistListingSnapshot = {
  listingId: string;
  dealScore: number | null;
  trustScore: number | null;
  fraudScore: number | null;
  confidence: number | null;
  recommendation: string | null;
  price: number | null;
  listingStatus: string | null;
};

export type WatchlistSummary = {
  watchlistCount: number;
  savedListings: number;
  unreadAlerts: number;
  changedToday: number;
  strongOpportunityUpdates: number;
};
