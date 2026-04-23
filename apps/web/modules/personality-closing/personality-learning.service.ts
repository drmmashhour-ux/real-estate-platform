import type { ClientPersonalityType } from "./personality.types";
import type { PersonalityLearningAgg } from "./personality.types";

const STORAGE = "lecipm-personality-learning-v1";

function load(): PersonalityLearningAgg {
  if (typeof localStorage === "undefined") {
    return { outcomes: {}, strategyHits: {} };
  }
  try {
    const raw = localStorage.getItem(STORAGE);
    if (!raw) return { outcomes: {}, strategyHits: {} };
    return JSON.parse(raw) as PersonalityLearningAgg;
  } catch {
    return { outcomes: {}, strategyHits: {} };
  }
}

function save(agg: PersonalityLearningAgg) {
  try {
    localStorage.setItem(STORAGE, JSON.stringify(agg));
  } catch {
    /* ignore */
  }
}

/** Call when a call or sim ends — pairs with CRM outcome where available. */
export function recordPersonalityOutcome(personality: ClientPersonalityType, psychologyStrategyKey: string, won: boolean): void {
  const agg = load();
  agg.outcomes[personality] = agg.outcomes[personality] ?? { tries: 0, wins: 0 };
  agg.outcomes[personality].tries += 1;
  if (won) agg.outcomes[personality].wins += 1;

  agg.strategyHits[personality] = agg.strategyHits[personality] ?? {};
  const row = (agg.strategyHits[personality]![psychologyStrategyKey] ??= { tries: 0, wins: 0 });
  row.tries += 1;
  if (won) row.wins += 1;

  save(agg);
}

export function loadPersonalityLearning(): PersonalityLearningAgg {
  return load();
}

export function personalityWinRates(limit = 4): { personality: ClientPersonalityType; rate: number; tries: number }[] {
  const agg = load();
  return (Object.entries(agg.outcomes) as [ClientPersonalityType, { tries: number; wins: number }][])
    .map(([personality, v]) => ({
      personality,
      rate: v.tries > 0 ? v.wins / v.tries : 0,
      tries: v.tries,
    }))
    .filter((x) => x.tries >= 1)
    .sort((a, b) => b.rate - a.rate)
    .slice(0, limit);
}

export function bestStrategyPerPersonality(
  personality: ClientPersonalityType,
): { strategyKey: string; rate: number; tries: number } | null {
  const agg = load();
  const hits = agg.strategyHits[personality];
  if (!hits) return null;
  const ranked = Object.entries(hits)
    .map(([strategyKey, v]) => ({
      strategyKey,
      rate: v.tries > 0 ? v.wins / v.tries : 0,
      tries: v.tries,
    }))
    .filter((x) => x.tries >= 2)
    .sort((a, b) => b.rate - a.rate);
  return ranked[0] ?? null;
}
