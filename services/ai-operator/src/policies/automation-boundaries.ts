/**
 * Automation boundaries: what the AI operator MAY do automatically vs MUST escalate.
 * Human override required for all destructive or high-impact actions.
 */

/** Actions the operator MAY take automatically (low risk). */
export const ALLOWED_AUTOMATED_ACTIONS = [
  "flag_listing_for_review",
  "flag_booking_for_review",
  "create_alert",
  "suggest_price_update",
  "route_support_ticket",
  "add_to_moderation_queue",
  "recommend_host_improvement",
  "set_demand_forecast",
] as const;

/** Actions that MUST require human review – never auto-apply. */
export const HUMAN_REQUIRED_ACTIONS = [
  "ban_account",
  "seize_funds",
  "finalize_legal",
  "remove_listing_permanently",
  "approve_high_risk_payout",
  "reject_listing",
  "cancel_booking",
  "refund_payment",
  "suspend_host",
  "suspend_guest",
] as const;

export function mayAutomate(action: string): boolean {
  return (ALLOWED_AUTOMATED_ACTIONS as readonly string[]).includes(action);
}

export function requiresHuman(action: string): boolean {
  return (HUMAN_REQUIRED_ACTIONS as readonly string[]).includes(action);
}

export function getEscalationReason(action: string): string | null {
  if (requiresHuman(action)) return "Policy: this action requires human approval.";
  if (action === "flag_listing_for_review" || action === "flag_booking_for_review") return null;
  return null;
}
