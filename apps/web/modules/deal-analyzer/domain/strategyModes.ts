export const UserStrategyMode = {
  BUY_TO_LIVE: "buy_to_live",
  BUY_TO_RENT: "buy_to_rent",
  BUY_TO_FLIP: "buy_to_flip",
  BUY_FOR_BNHUB: "buy_for_bnhub",
  HOLD_LONG_TERM: "hold_long_term",
} as const;
export type UserStrategyMode = (typeof UserStrategyMode)[keyof typeof UserStrategyMode];
