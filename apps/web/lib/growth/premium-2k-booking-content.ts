/**
 * Premium high-ticket (~$2K+) DM / concierge flow — illustrative goals, not guarantees.
 */
export const PREMIUM_2K_POSITIONING = {
  not: "a website",
  are: "someone who finds high-quality, better-value stays",
} as const;

export const PREMIUM_2K_MESSAGES = {
  opening: `Hey — I help people find really solid, high-quality listings that are often priced better than similar ones.

If you're planning something, I can help you find something great.`,

  qualify: `Perfect — tell me:

• where
• dates
• budget range
• what matters most (comfort, location, luxury, etc.)`,

  present: `I found a couple strong options for you 👇

These stand out compared to similar listings — better value and quality.`,

  close: `If I had to recommend one, I'd go with this one.

It's the best balance of quality and price, and these tend to get booked quickly.

You can secure it here:
[BOOK LINK]`,

  objectionExpensive: `Totally fair — at this level, it's more about getting the best value rather than just the lowest price.

This one stands out compared to similar options.`,

  objectionThink: `Makes sense — I'd just keep in mind that good listings at this level tend to get taken quickly.`,
} as const;

export const PREMIUM_2K_RULES = {
  maxOptions: "2 options max — clean, high-quality listings only.",
  key: "Premium buyers want the right choice, not a long menu.",
} as const;

/** Planning heuristic — model your own conversion and AOV. */
export const PREMIUM_2K_GOAL =
  "3 serious users → 1 booking → $2K+ band (depends on market, stay length, and your take)." as const;

export const SYSTEM_SNAPSHOT_ROWS: ReadonlyArray<{ level: string; capability: string }> = [
  { level: "Backend", capability: "Production-grade" },
  { level: "Booking", capability: "Reliable" },
  { level: "Payments", capability: "Working" },
  { level: "Growth", capability: "Scalable playbook" },
  { level: "Sales", capability: "High-ticket flows" },
] as const;
