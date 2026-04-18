/** Syria region preview signals — pure types (read-only intelligence; no execution). */

export type SyriaSignalType =
  | "low_conversion_high_views"
  | "low_booking_activity"
  | "potential_fraud_pattern"
  | "listing_stale"
  | "payout_anomaly"
  | "review_backlog"
  | "inactive_listing";

export type SyriaSignalSeverity = "info" | "warning" | "critical";

export type SyriaSignal = {
  type: SyriaSignalType;
  severity: SyriaSignalSeverity;
  message: string;
  contributingMetrics: Record<string, number | string | null>;
};

export type SyriaOpportunity = {
  id: string;
  signalType: SyriaSignalType;
  title: string;
  description: string;
  /** Advisory strings only — not executable automation. */
  suggestedActions: string[];
  priority: "low" | "medium" | "high";
};
