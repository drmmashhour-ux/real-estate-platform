import type { ClientPsychologicalState } from "./psychology.types";

const STORAGE = "lecipm-psychology-learning-v1";

export type PsychologyLearningAgg = {
  /** strategyKey -> counts */
  outcomes: Record<string, { tries: number; wins: number }>;
  /** state -> seen count */
  states: Partial<Record<ClientPsychologicalState, number>>;
};

function load(): PsychologyLearningAgg {
  if (typeof localStorage === "undefined") {
    return { outcomes: {}, states: {} };
  }
  try {
    const raw = localStorage.getItem(STORAGE);
    if (!raw) return { outcomes: {}, states: {} };
    return JSON.parse(raw) as PsychologyLearningAgg;
  } catch {
    return { outcomes: {}, states: {} };
  }
}

function save(agg: PsychologyLearningAgg) {
  try {
    localStorage.setItem(STORAGE, JSON.stringify(agg));
  } catch {
    /* ignore */
  }
}

/** Call after a session outcome (demo booked = win, lost = loss) — improves heuristic ranking over time. */
export function recordPsychologyOutcome(strategyKey: string, state: ClientPsychologicalState, won: boolean): void {
  const agg = load();
  agg.outcomes[strategyKey] = agg.outcomes[strategyKey] ?? { tries: 0, wins: 0 };
  agg.outcomes[strategyKey].tries += 1;
  if (won) agg.outcomes[strategyKey].wins += 1;
  agg.states[state] = (agg.states[state] ?? 0) + 1;
  save(agg);
}

export function loadPsychologyLearning(): PsychologyLearningAgg {
  return load();
}

export function bestPerformingStrategyKeys(limit = 5): { key: string; rate: number; tries: number }[] {
  const agg = load();
  return Object.entries(agg.outcomes)
    .map(([key, v]) => ({
      key,
      rate: v.tries > 0 ? v.wins / v.tries : 0,
      tries: v.tries,
    }))
    .filter((x) => x.tries >= 2)
    .sort((a, b) => b.rate - a.rate)
    .slice(0, limit);
}
