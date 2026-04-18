/** Canonical funnel stages for host conversion analytics (string storage in DB). */
export const HOST_FUNNEL_STAGES = [
  "visitor",
  "roi_started",
  "roi_completed",
  "lead_created",
  "contacted",
  "onboarding_started",
  "listing_import_started",
  "onboarding_completed",
  "activated",
  "converted_paid",
] as const;
