/** Daily execution quotas (revenue discipline). */
export const DAILY_TARGETS = {
  messages: 20,
  brokers: 5,
  bookings: 1,
} as const;

/** Platform revenue goal for execution dashboard progress. */
export const REVENUE_GOAL_USD = 100_000;

export const EXECUTION_ACTION_TYPES = ["message", "call", "follow_up", "close"] as const;
export type ExecutionActionType = (typeof EXECUTION_ACTION_TYPES)[number];
