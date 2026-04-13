import type { RevenueAutopilotMode } from "@prisma/client";

export const ACTION_PROMOTE_LISTING = "promote_listing";
export const ACTION_GENERATE_CONTENT = "generate_more_content";
export const ACTION_SUGGEST_PRICE_REVIEW = "suggest_price_review";
export const ACTION_UPSELL_FEATURED = "upsell_featured";
export const ACTION_IMPROVE_CONVERSION = "improve_conversion";
export const ACTION_RECOVER_ABANDONED = "recover_abandoned_revenue";
export const ACTION_BROKER_FOLLOWUP = "prioritize_broker_followup";
export const ACTION_TRIGGER_LISTING_OPT = "trigger_listing_optimization";
export const ACTION_TRIGGER_PORTFOLIO = "trigger_portfolio_autopilot";

export function revenueSafeAutoEnabled(mode: RevenueAutopilotMode): boolean {
  return mode === "safe_autopilot";
}

export function revenueApprovalRequired(mode: RevenueAutopilotMode): boolean {
  return mode === "approval_required";
}
