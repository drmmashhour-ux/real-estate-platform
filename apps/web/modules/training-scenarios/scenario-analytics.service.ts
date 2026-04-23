const STORAGE = "lecipm-training-scenario-analytics-v1";

export type ScenarioStatsRow = {
  plays: number;
  wins: number;
  totalComposite: number;
  /** rolling worst composite (lower = harder experience) */
  minComposite: number;
};

export type ScenarioAnalyticsAgg = {
  byScenario: Record<string, ScenarioStatsRow>;
  /** session-level rolling for “improvement” chart — last N composite averages */
  recentSessionComposites: number[];
};

function empty(): ScenarioAnalyticsAgg {
  return { byScenario: {}, recentSessionComposites: [] };
}

function load(): ScenarioAnalyticsAgg {
  if (typeof localStorage === "undefined") return empty();
  try {
    const raw = localStorage.getItem(STORAGE);
    if (!raw) return empty();
    return { ...empty(), ...JSON.parse(raw) } as ScenarioAnalyticsAgg;
  } catch {
    return empty();
  }
}

function save(agg: ScenarioAnalyticsAgg) {
  try {
    localStorage.setItem(STORAGE, JSON.stringify(agg));
  } catch {
    /* ignore */
  }
}

export function recordScenarioSession(scenarioId: string, compositeAvg: number, won: boolean): void {
  const agg = load();
  const row = (agg.byScenario[scenarioId] ??= {
    plays: 0,
    wins: 0,
    totalComposite: 0,
    minComposite: 100,
  });
  row.plays += 1;
  row.totalComposite += compositeAvg;
  row.minComposite = Math.min(row.minComposite, compositeAvg);
  if (won) row.wins += 1;

  agg.recentSessionComposites = [...agg.recentSessionComposites, compositeAvg].slice(-24);
  save(agg);
}

export function loadScenarioAnalytics(): ScenarioAnalyticsAgg {
  return load();
}

export function hardestScenarios(limit = 5): { id: string; avgComposite: number; plays: number }[] {
  const agg = load();
  return Object.entries(agg.byScenario)
    .map(([id, r]) => ({
      id,
      avgComposite: r.plays > 0 ? r.totalComposite / r.plays : 0,
      plays: r.plays,
    }))
    .filter((x) => x.plays >= 1)
    .sort((a, b) => a.avgComposite - b.avgComposite)
    .slice(0, limit);
}

export function bestScenarios(limit = 5): { id: string; winRate: number; plays: number }[] {
  const agg = load();
  return Object.entries(agg.byScenario)
    .map(([id, r]) => ({
      id,
      winRate: r.plays > 0 ? r.wins / r.plays : 0,
      plays: r.plays,
    }))
    .filter((x) => x.plays >= 2)
    .sort((a, b) => b.winRate - a.winRate)
    .slice(0, limit);
}

export function improvementTrend(): { improving: boolean; delta: number } {
  const agg = load();
  const xs = agg.recentSessionComposites;
  if (xs.length < 4) return { improving: false, delta: 0 };
  const half = Math.floor(xs.length / 2);
  const a = xs.slice(0, half).reduce((s, x) => s + x, 0) / half;
  const b = xs.slice(half).reduce((s, x) => s + x, 0) / (xs.length - half);
  return { improving: b > a, delta: Math.round((b - a) * 10) / 10 };
}
