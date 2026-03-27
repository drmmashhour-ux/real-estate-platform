export const SellerPricePosition = {
  COMPETITIVELY_POSITIONED: "competitively_positioned",
  SLIGHTLY_HIGH: "slightly_high",
  MEANINGFULLY_HIGH: "meaningfully_high",
  INSUFFICIENT_MARKET_DATA: "insufficient_market_data",
} as const;

export const SellerPricingAction = {
  KEEP_CURRENT_PRICE: "keep_current_price",
  REVIEW_COMPARABLE_POSITIONING: "review_comparable_positioning",
  IMPROVE_TRUST_COMPLETENESS: "improve_listing_trust_completeness_before_changing_price",
  GATHER_MORE_MARKET_EVIDENCE: "gather_more_market_evidence",
} as const;
