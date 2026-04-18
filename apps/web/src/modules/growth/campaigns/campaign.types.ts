export type GrowthCampaignKindV2 =
  | "price_drop_alert"
  | "similar_listing_alert"
  | "watchlist_digest"
  | "saved_search_match"
  | "broker_followup"
  | "inquiry_recovery"
  | "booking_recovery"
  | "host_optimization_reminder"
  | "seo_launch_promo"
  | "referral_invite";

export type CampaignCandidateStatus =
  | "candidate"
  | "eligible"
  | "blocked"
  | "approved"
  | "queued"
  | "sent"
  | "failed"
  | "suppressed";
