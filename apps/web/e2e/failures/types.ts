export type E2EFailureType =
  | "ui_localization"
  | "rtl_layout"
  | "api_error"
  | "booking_transition"
  | "stripe_checkout"
  | "stripe_webhook"
  | "manual_payment"
  | "permission_error"
  | "missing_translation"
  | "market_resolution"
  | "ai_locale_mismatch"
  | "notification_error"
  | "db_consistency"
  | "infra_blocked"
  | "unknown";

export type E2ELocale = "en" | "fr" | "ar";

export type E2ERole = "guest" | "host" | "admin";

export interface E2EFailureContext {
  scenarioName: string;
  scenarioSlug: string;
  scenarioId: number;
  stepName: string;
  locale: E2ELocale;
  market: string;
  role: E2ERole;
  route: string | null;
  bookingId?: string | null;
  listingId?: string | null;
  paymentMode?: "online" | "manual" | null;
  bookingStatus?: string | null;
  manualPaymentStatus?: string | null;
  apiStatusCode?: number | null;
  apiBodySnippet?: string | null;
  errorMessage: string;
  logSnippet?: string | null;
  stackTrace?: string | null;
  timestamp: string;
}

export type E2EFailureSeverity = "critical" | "high" | "medium" | "low";

export interface E2EFailureRecord {
  type: E2EFailureType;
  severity: E2EFailureSeverity;
  context: E2EFailureContext;
  likelyRootCause: string;
  suggestedFixZones: string[];
  filesLikelyInvolved: string[];
  safeRerunConditions: string;
  rerunRecommended: boolean;
}
