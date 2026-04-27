/**
 * Organic growth + early trust copy (tune in one place; used by landing and social templates).
 * Replace numbers/phrasing as real metrics prove out — avoid misleading claims.
 */
export const EARLY_TRUST = {
  /** Social proof line 1 */
  usersExploring: "People are exploring live listings on the platform",
  /** Social proof line 2 — set via env in production if you show real recency */
  recentBookings: "Recent stays are booking (availability moves fast on good picks)",
  /** Social proof line 3 */
  highDemand: "High demand on popular dates and cities",
} as const;

/** Daily post for short-form / X / LinkedIn — replace [link] with your public URL. */
export const DAILY_SOCIAL_POST_TEMPLATE = `I found a listing that's underpriced compared to others

Most people overpay without realizing it.

I built a tool to fix that.

Try it:
[link]` as const;

export const GROWTH_VALUE_PITCH = {
  headline: "Find underpriced listings before they disappear",
  sub:
    "We help you spot stays priced better than the average for the same week — not another vague “real estate platform.”",
  manualEdge:
    "We still help people manually when it matters. That is the edge: real help, not another faceless app.",
} as const;

/**
 * Realistic funnel reference (illustrative — not a promise). Tweak for your AOV and conversion.
 */
export const FUNNEL_MATH_ROWS: ReadonlyArray<{
  step: string;
  result: string;
}> = [
  { step: "1,000 people reached", result: "Awareness" },
  { step: "100 try", result: "Try" },
  { step: "20 serious", result: "Qualified" },
  { step: "10 book", result: "Example band often discussed: $5K–$10K (depends on fee & AOV)" },
] as const;

export const GROWTH_REMINDERS = {
  youNeed: ["Conversations", "Trust", "Action"],
  skipForNow: ["Piling on features", "Endless backend work", "AI for its own sake"],
} as const;
