export const MarketConditionKind = {
  BUYER_FAVORABLE: "buyer_favorable",
  BALANCED: "balanced",
  SELLER_FAVORABLE: "seller_favorable",
  UNCERTAIN: "uncertain",
} as const;
export type MarketConditionKind = (typeof MarketConditionKind)[keyof typeof MarketConditionKind];
