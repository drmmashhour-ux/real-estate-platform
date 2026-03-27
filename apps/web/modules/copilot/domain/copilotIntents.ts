/**
 * User-facing Copilot intents — mapped to deterministic platform actions (no scoring authority).
 */
export const CopilotUserIntent = {
  FIND_DEALS: "find_deals",
  ANALYZE_PROPERTY: "analyze_property",
  WHY_NOT_SELLING: "why_not_selling",
  IMPROVE_LISTING: "improve_listing",
  PORTFOLIO_SUMMARY: "portfolio_summary",
  RISK_CHECK: "risk_check",
  PRICING_HELP: "pricing_help",
  UNKNOWN: "unknown",
} as const;

export type CopilotUserIntent = (typeof CopilotUserIntent)[keyof typeof CopilotUserIntent];

export const COPILOT_INTENT_LABELS: Record<CopilotUserIntent, string> = {
  [CopilotUserIntent.FIND_DEALS]: "Find and rank listings",
  [CopilotUserIntent.ANALYZE_PROPERTY]: "Analyze a property (Deal Analyzer)",
  [CopilotUserIntent.WHY_NOT_SELLING]: "Diagnose slow / no traction",
  [CopilotUserIntent.IMPROVE_LISTING]: "Improve trust and completeness",
  [CopilotUserIntent.PORTFOLIO_SUMMARY]: "Portfolio / watchlist summary",
  [CopilotUserIntent.RISK_CHECK]: "Risk and trust check",
  [CopilotUserIntent.PRICING_HELP]: "Pricing position (not an appraisal)",
  [CopilotUserIntent.UNKNOWN]: "Clarify intent",
};
