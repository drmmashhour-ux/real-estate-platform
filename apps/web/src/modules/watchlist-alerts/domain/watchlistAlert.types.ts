export type WatchlistAlertStatus = "unread" | "read" | "dismissed";
export type WatchlistAlertSeverity = "info" | "warning" | "critical";

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

export type WatchlistAlertInput = {
  userId: string;
  watchlistId: string | null;
  listingId: string;
  alertType: WatchlistAlertType;
  severity: WatchlistAlertSeverity;
  title: string;
  message: string;
  metadata: Record<string, unknown>;
};

export type WatchlistAlertDto = {
  id: string;
  userId: string;
  watchlistId: string | null;
  listingId: string;
  alertType: WatchlistAlertType;
  severity: WatchlistAlertSeverity;
  title: string;
  message: string;
  metadata: Record<string, unknown> | null;
  status: WatchlistAlertStatus;
  createdAt: Date;
  updatedAt: Date;
};
