import type { PortfolioAutopilotMode } from "@prisma/client";

export const ACTION_OPTIMIZE_WEAK = "optimize_weak_listings";
export const ACTION_CONTENT_TOP = "generate_content_top_listings";
export const ACTION_PRICING_REVIEW = "review_pricing_listings";
export const ACTION_RESPONSE_TIME = "improve_response_time";
export const ACTION_PROMOTE_CONVERTERS = "promote_strong_converters";
export const ACTION_OPPORTUNITY_LISTING = "address_opportunity_listing";

export function shouldQueuePortfolioActionsForApproval(mode: PortfolioAutopilotMode): boolean {
  return mode === "approval_required";
}

export function portfolioSafeAutoRunEnabled(mode: PortfolioAutopilotMode): boolean {
  return mode === "safe_autopilot";
}
