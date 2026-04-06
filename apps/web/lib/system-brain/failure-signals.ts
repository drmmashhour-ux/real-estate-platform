/**
 * Ops / E2E failure taxonomy for the system brain (kept in `lib/` so production code never imports `e2e/`).
 * Keep in sync with `e2e/failures/types.ts` → `E2EFailureType`.
 */
export type BrainFailureSignal =
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
