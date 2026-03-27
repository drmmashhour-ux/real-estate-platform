/**
 * Automation policies – what the AI Property Manager may and may not do automatically.
 */

/** Actions the AI may perform automatically (low-risk). */
export const ALLOWED_AUTOMATED_ACTIONS = [
  "generate_pricing_suggestion",
  "create_listing_improvement_task",
  "create_host_reminder",
  "open_low_risk_internal_alert",
  "route_support_ticket",
  "refresh_portfolio_insights",
  "refresh_demand_forecast",
  "flag_suspicious_property_for_review",
] as const;

/** Actions that MUST require human review – AI must not perform these automatically. */
export const HUMAN_REVIEW_REQUIRED_ACTIONS = [
  "ban_user_permanently",
  "release_or_seize_funds_permanently",
  "remove_listing_permanently",
  "finalize_legal_or_compliance_action",
  "override_trust_safety_decision_critical",
] as const;

export function mayAutomate(action: string): boolean {
  return (ALLOWED_AUTOMATED_ACTIONS as readonly string[]).includes(action);
}

export function requiresHumanReview(action: string): boolean {
  return (HUMAN_REVIEW_REQUIRED_ACTIONS as readonly string[]).includes(action);
}
