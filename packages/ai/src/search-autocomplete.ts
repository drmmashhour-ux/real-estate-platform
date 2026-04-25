/**
 * Rule-based search suggestions (no ML). Safe to expose publicly — no user data.
 */

const POPULAR_INTENTS = [
  "cheap condo near metro",
  "luxury apartment downtown",
  "affordable stay near transit",
  "family house 3 bedrooms",
  "pet friendly Montreal",
  "Toronto verified listings",
  "Quebec City weekend",
  "budget studio under 100",
];

export function searchQuerySuggestions(query: string, limit = 8): string[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) {
    return POPULAR_INTENTS.slice(0, limit);
  }
  const scored = POPULAR_INTENTS.map((p) => {
    const pl = p.toLowerCase();
    if (pl.startsWith(q)) return { p, rank: 0 };
    if (pl.includes(q)) return { p, rank: 1 };
    return { p, rank: 2 };
  })
    .filter((x) => x.rank < 2)
    .sort((a, b) => a.rank - b.rank || a.p.localeCompare(b.p));
  const out = scored.map((x) => x.p);
  return [...new Set(out)].slice(0, limit);
}
