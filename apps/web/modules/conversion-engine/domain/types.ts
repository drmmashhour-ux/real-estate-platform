export type ConversionStage = "visitor" | "signup" | "analysis" | "lead" | "paid";

export type ConversionTrackEvent =
  | "signup"
  | "analysis_run"
  | "high_score_view"
  | "repeat_listing_click"
  | "lead_created"
  | "lead_purchased"
  | "inactive_ping";

export type ConversionTrigger =
  | "post_signup_welcome"
  | "first_analysis_follow_up"
  | "analysis_threshold"
  | "high_value_view"
  | "repeat_listing_interest"
  | "inactive_reactivation";
