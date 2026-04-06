export type AutomationRuleKey =
  | "listing_completion"
  | "stalled_booking"
  | "pricing_opportunity"
  | "host_payout_readiness"
  | "trust_review_signal"
  | "admin_daily_summary"
  | "guest_abandoned_journey"
  | "re_engagement_host_drafts"
  | "review_gap_signal";

export const AUTOMATION_RULE_DEFINITIONS: {
  key: AutomationRuleKey;
  name: string;
  description: string;
  frequency: string;
}[] = [
  {
    key: "listing_completion",
    name: "Listing completion",
    description: "Detect missing STR fields; create AI recommendations for drafts.",
    frequency: "event",
  },
  {
    key: "stalled_booking",
    name: "Stalled booking",
    description: "Flag pending / awaiting-payment style stalls for follow-up recommendations.",
    frequency: "hourly",
  },
  {
    key: "pricing_opportunity",
    name: "Pricing opportunity",
    description: "Suggest promotion review when listing is published but has zero completed stays (heuristic).",
    frequency: "daily",
  },
  {
    key: "host_payout_readiness",
    name: "Host payout readiness",
    description: "Remind hosts when Stripe Connect is incomplete.",
    frequency: "daily",
  },
  {
    key: "trust_review_signal",
    name: "Trust review signal",
    description: "Open disputes create admin recommendations (uses existing dispute records).",
    frequency: "event",
  },
  {
    key: "admin_daily_summary",
    name: "Admin daily summary",
    description: "Refresh admin-facing AI snapshot rows (counts only).",
    frequency: "daily",
  },
  {
    key: "guest_abandoned_journey",
    name: "Guest abandoned checkout",
    description: "Guests with stale PENDING bookings get an in-app recommendation to resume or cancel.",
    frequency: "hourly",
  },
  {
    key: "re_engagement_host_drafts",
    name: "Host draft re-engagement",
    description: "Hosts with listing drafts idle 7+ days receive a nudge recommendation.",
    frequency: "daily",
  },
  {
    key: "review_gap_signal",
    name: "Review gap signal",
    description: "Completed stays without a guest review after a cooling window — host-facing follow-up card only.",
    frequency: "daily",
  },
];
