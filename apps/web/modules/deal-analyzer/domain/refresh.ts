export const RefreshJobStatus = {
  PENDING: "pending",
  RUNNING: "running",
  COMPLETED: "completed",
  FAILED: "failed",
  SKIPPED: "skipped",
} as const;

export const RefreshTriggerSource = {
  MANUAL: "manual",
  STALE: "stale_analysis",
  PRICE_CHANGE: "price_change",
  LISTING_UPDATE: "listing_update",
  TRUST_CHANGE: "trust_change",
  REGION_RULE: "region_rule",
  SCHEDULED: "scheduled",
} as const;

export const RefreshEventType = {
  COMPARABLES_REFRESHED: "comparables_refreshed",
  SKIPPED_NO_NEED: "skipped_no_need",
  FAILED: "failed",
} as const;
