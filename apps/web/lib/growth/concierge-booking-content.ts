/**
 * High-ticket / concierge booking playbook — copy in one place.
 * Illustrative goals and $ ranges are planning aids, not guarantees.
 */
export const CONCIERGE_POSITIONING = {
  headline: "Close high-value bookings (concierge, not just a link)",
  strategy:
    "Act like a premium concierge: quality over volume, 2–3 options max, clear recommendation, calm urgency.",
} as const;

export const TARGET_USER_CRITERIA = [
  "Planning a trip (dates in mind or soon)",
  "Real budget (illustrative floor: $500+ for a meaningful stay)",
  "Wants something that feels “nice” — not only the cheapest",
] as const;

export const MESSAGES = {
  qualifyInitial: `Hey! I help people find really good listings that are priced better than similar options.

If you're planning something, I can find you a really solid place.

What are you looking for?`,

  askDetails: `Perfect — just send me:

• location
• dates
• budget
• vibe (luxury / chill / cheap / etc.)`,

  sendOptionsIntro: `I found a couple really good options for you 👇

These are priced better than similar listings and still available.`,

  close: `If I were you, I'd go with this one.

It's the best value and these usually don't stay available long.

You can lock it here:
[BOOK LINK]`,

  objectionThinkAbout: `Totally fair — just a heads up, good listings tend to go quickly, so I wouldn't wait too long if you like it.`,

  objectionTooExpensive: `I get that — but compared to similar places, this one is actually priced better.

I can also find a slightly cheaper option if you want`,
} as const;

export const CONCIERGE_RULES = {
  maxOptions: "Send 2–3 listings max (never 10). Fewer choices → more conversions.",
  keyRule: "Guide the decision; reduce hesitation; use calm urgency, not pressure.",
} as const;

export const WHY_CLOSE_WORKS = [
  "You guide the decision (default for busy travelers).",
  "You reduce hesitation (one clear “if I were you” pick).",
  "You create urgency with availability, not fake timers.",
] as const;

/** Planning goal — your actual AOV and conversion will vary. */
export const CONCIERGE_GOAL = {
  blurb: "5 serious users → 1–2 bookings → illustrative $1,000+ band (model your net take and AOV).",
} as const;

export const DAILY_TARGETS: ReadonlyArray<{ action: string; target: string }> = [
  { action: "Messages (outbound)", target: "30–50" },
  { action: "Replies", target: "10" },
  { action: "Qualified", target: "3–5" },
  { action: "Bookings", target: "1–2" },
] as const;

export const AUTHORITY_PHRASES = [
  "I compare listings daily.",
  "I've seen the pricing patterns in this market.",
  "This one is clearly better value for what you get.",
] as const;

/** Second daily post variant — authority + CTA. No [link] in body; add in bio or first comment. */
export const DAILY_SOCIAL_POST_AUTHORITY = `Most people overpay for listings.

I found one that's clearly underpriced 👀

I help people find deals like this.

Want me to find one for you?` as const;

export const SCALED_REVENUE_NOTE =
  "Turn this into revenue by repeating the same qualify → 2–3 options → one recommendation → book link loop daily; track sources and replies in a sheet." as const;
