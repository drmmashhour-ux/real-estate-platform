/** Template variant keys per Host Autopilot rule (first entry = default fallback). */
export const HOST_AUTOPILOT_TEMPLATE_KEYS: Record<string, readonly string[]> = {
  host_autopilot_listing_optimization: ["listing_opt_default", "listing_opt_concise"],
  host_autopilot_pricing_suggestion: ["pricing_default", "pricing_experiment_note"],
  host_autopilot_pricing_change: ["pricing_approval_default"],
  host_autopilot_message_draft: ["msg_warm", "msg_neutral"],
  host_autopilot_promotion_suggestion: ["promo_default", "promo_midweek"],
  host_autopilot_stalled_booking: ["stalled_default", "stalled_urgent"],
  host_autopilot_payout_hint: ["payout_default"],
  host_autopilot_low_performance: ["low_perf_default", "low_perf_checklist"],
  host_autopilot_revenue_promotion: ["rev_promo_default", "rev_promo_midweek"],
  host_autopilot_revenue_pricing_review: ["rev_pricing_review_default"],
  host_autopilot_revenue_copy_refresh: ["rev_copy_refresh_default"],
  host_autopilot_revenue_listing_quality_fix: ["rev_quality_default"],
};

export function templatesForAutopilotRule(ruleName: string): readonly string[] {
  return HOST_AUTOPILOT_TEMPLATE_KEYS[ruleName] ?? ["host_autopilot_default"];
}
