import type { KeywordRecord, KeywordTheme } from "./seo.types";

function uid(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `kw-${Date.now()}`;
}

const CORE_SEED: { phrase: string; strength: number }[] = [
  { phrase: "homes for sale", strength: 9 },
  { phrase: "real estate broker", strength: 8 },
  { phrase: "buy investment property", strength: 8 },
  { phrase: "how to sell your house", strength: 7 },
  { phrase: "mortgage pre-approval", strength: 7 },
  { phrase: "rent vs buy calculator", strength: 6 },
];

const INVEST_SEED: { phrase: string; strength: number }[] = [
  { phrase: "best areas to invest", strength: 9 },
  { phrase: "cap rate real estate", strength: 8 },
  { phrase: "short term rental ROI", strength: 8 },
  { phrase: "duplex investment strategy", strength: 7 },
  { phrase: "BNB vs long-term lease", strength: 6 },
];

/** Seed keywords shipped with the module — extend via discoverKeywords */
export function getCoreRealEstateKeywords(): KeywordRecord[] {
  return CORE_SEED.map((s) => ({
    id: uid(),
    phrase: s.phrase,
    theme: "REAL_ESTATE_CORE" satisfies KeywordTheme,
    strength: s.strength,
  }));
}

export function getInvestmentTopicKeywords(): KeywordRecord[] {
  return INVEST_SEED.map((s) => ({
    id: uid(),
    phrase: s.phrase,
    theme: "INVESTMENT",
    strength: s.strength,
  }));
}

/**
 * Location-aware queries e.g. “homes for sale in Montreal”, “invest in Laval”.
 */
export function buildLocationKeywords(city: string, region?: string): KeywordRecord[] {
  const loc = region ? `${city} ${region}` : city;
  const phrases = [
    `homes for sale in ${city}`,
    `${city} real estate market`,
    `best neighbourhoods ${city}`,
    `invest in ${city} real estate`,
    `rental yield ${city}`,
    `condos downtown ${city}`,
  ];
  return phrases.map((phrase, i) => ({
    id: uid(),
    phrase,
    theme: "LOCATION" satisfies KeywordTheme,
    location: loc,
    strength: 7 + (i % 3),
  }));
}

/** Merge themes and de-duplicate by phrase (first wins) */
export function mergeKeywordPools(pools: KeywordRecord[][]): KeywordRecord[] {
  const seen = new Set<string>();
  const out: KeywordRecord[] = [];
  for (const pool of pools) {
    for (const k of pool) {
      const key = k.phrase.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(k);
    }
  }
  return out.sort((a, b) => b.strength - a.strength);
}
