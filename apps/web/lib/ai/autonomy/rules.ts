import type { AutomationRuleKey } from "../actions/automation-rules";

/** Maps automation rules to autonomy domains (kill-switch granularity). */
export const AUTOMATION_RULE_DOMAIN: Record<AutomationRuleKey, string> = {
  listing_completion: "listings",
  stalled_booking: "bookings",
  pricing_opportunity: "listings",
  host_payout_readiness: "payouts",
  trust_review_signal: "trust_safety",
  admin_daily_summary: "admin_insights",
  guest_abandoned_journey: "bookings",
  re_engagement_host_drafts: "listings",
  review_gap_signal: "listings",
};
