/**
 * Canonical event names for ranking, recommendations, experiments, and conversion.
 * Persisted to `EventLog` (+ legacy `PlatformIntelligenceEvent` where noted).
 */
export const PRODUCT_EVENT_NAMES = [
  "listing_impression",
  "listing_click",
  "listing_save",
  "listing_unsave",
  "listing_share",
  "inquiry_start",
  "inquiry_submit",
  "booking_start",
  "booking_complete",
  "search_performed",
  "filter_applied",
  "price_drop_seen",
  "recommendation_impression",
  "recommendation_click",
  "featured_listing_seen",
  "roi_calculator_started",
  "roi_calculator_completed",
  "onboarding_started",
  "onboarding_completed",
  "experiment_exposure",
  "cta_clicked",
  "deal_created",
  "form_package_selected",
  "document_prefill_run",
  "document_issue_detected",
  "clause_suggestion_generated",
  "clause_suggestion_approved",
  "clause_suggestion_rejected",
  "document_rendered",
  "export_generated",
  "review_completed",
] as const;

export type ProductEventName = (typeof PRODUCT_EVENT_NAMES)[number] | (string & {});

export const PRODUCT_EVENT_SET = new Set<string>(PRODUCT_EVENT_NAMES);
