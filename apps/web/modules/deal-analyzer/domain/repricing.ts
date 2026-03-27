export const RepricingTriggerType = {
  MOVED_ABOVE_COMPARABLE_RANGE: "moved_above_comparable_range",
  COMP_CONFIDENCE_IMPROVED: "comparable_confidence_improved",
  TRUST_IMPROVED_PRICE_STILL_HIGH: "trust_improved_but_price_still_high",
  CONFIDENCE_DROPPED_MARKET_DATA: "confidence_dropped_due_to_market_data_change",
  STALE_WEAK_POSITION: "listing_stale_with_weak_position",
  DOCS_COMPLETED_REVIEW_PRICE: "docs_completed_now_review_price",
} as const;
