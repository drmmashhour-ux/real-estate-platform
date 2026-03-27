/**
 * Deterministic “daily content” pack for BNHub social/growth (no external LLM required).
 */

const HASHTAG_POOL = [
  "#BNHub",
  "#ShortTermRental",
  "#TravelCanada",
  "#Staycation",
  "#BookDirect",
  "#HostTips",
  "#GuestFavorite",
  "#WeekendGetaway",
];

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function hashSeed(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i += 1) h = (h * 31 + input.charCodeAt(i)) >>> 0;
  return h;
}

function pick<T>(arr: T[], seed: number, i: number): T {
  return arr[(seed + i * 17) % arr.length]!;
}

export type BnhubDailyContentPack = {
  date: string;
  posts: { title: string; body: string; caption: string; hashtags: string[] }[];
};

export function generateBnhubDailyContentPack(forDate: Date = new Date()): BnhubDailyContentPack {
  const date = dayKey(forDate);
  const seed = hashSeed(`bnhub-content-${date}`);

  const themes = [
    {
      title: "Why guests book direct on BNHub",
      body: "Skip opaque fees: transparent pricing, local hosts, and secure payments — all in one place.",
    },
    {
      title: "Host spotlight template",
      body: "Share what makes your space special: neighborhood gems, check-in ease, and the little extras guests love.",
    },
    {
      title: "Weekend itinerary hook",
      body: "Pair a 2-night stay with coffee, trails, and a dinner reservation — your listing is the anchor.",
    },
  ];

  const posts = themes.map((t, idx) => {
    const h1 = pick(HASHTAG_POOL, seed, idx);
    const h2 = pick(HASHTAG_POOL, seed, idx + 3);
    const h3 = pick(HASHTAG_POOL, seed, idx + 5);
    const caption = `${t.title} — ${t.body.slice(0, 120)}${t.body.length > 120 ? "…" : ""}`;
    return {
      title: t.title,
      body: t.body,
      caption,
      hashtags: [h1, h2, h3],
    };
  });

  return { date, posts };
}
