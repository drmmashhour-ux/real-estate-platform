/** PostHog event names — keep stable for funnel reporting. */
export const AnalyticsEvents = {
  SIGNUP_COMPLETED: "signup_completed",
  LOGIN_COMPLETED: "login_completed",
  LISTING_CREATED: "listing_created",
  LISTING_PUBLISHED: "listing_published",
  LISTING_VERIFIED: "listing_verified",
  ISSUES_FIXED: "issues_fixed",
  TRUSTGRAPH_RUN: "trustgraph_run",
  DEAL_ANALYSIS_RUN: "deal_analysis_run",
  DEAL_FLAGGED_AS_OPPORTUNITY: "deal_flagged_as_opportunity",
  COPILOT_REQUEST: "copilot_request",
  UPGRADE_CLICKED: "upgrade_clicked",
  CHECKOUT_STARTED: "checkout_started",
  SUBSCRIPTION_ACTIVATED: "subscription_activated",
  CHURN_DETECTED: "churn_detected",
  LEAD_SCORED: "lead_scored",
  EMAIL_SENT: "email_sent",
  RETENTION_TRIGGER_FIRED: "retention_trigger_fired",
  VERIFIED_BADGE_UNLOCKED: "verified_badge_unlocked",
} as const;

export type AnalyticsEventName = (typeof AnalyticsEvents)[keyof typeof AnalyticsEvents];
