/** Keys for deterministic automation cron + admin runners (must align with seeded `manager_ai_automation_rules`). */
export const AUTOMATION_RULE_KEYS = [
  "digest_weekly_metrics",
  "review_stale_approvals",
  "guest_abandoned_journey",
  "listing_visibility_gap",
  "re_engagement_host_drafts",
  "admin_daily_summary",
] as const;

export type AutomationRuleKey = (typeof AUTOMATION_RULE_KEYS)[number];

export function isAutomationRuleKey(s: string): s is AutomationRuleKey {
  return (AUTOMATION_RULE_KEYS as readonly string[]).includes(s);
}
