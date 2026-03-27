/** LECIPM conversion plan codes stored in `LecipmConversionPlan.code` */
export type ConversionPlanCode = "free" | "pro" | "team";

/** Feature keys for entitlements + usage (deterministic). */
export type ConversionFeatureKey =
  | "simulations"
  | "ai_drafting"
  | "negotiation_drafts"
  | "scenario_history"
  | "presentation_mode"
  | "advanced_command_center"
  | "legal_assistant"
  | "watchlist_alerts"
  | "daily_deal_feed";
