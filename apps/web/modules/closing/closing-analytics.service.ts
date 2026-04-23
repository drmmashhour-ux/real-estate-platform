import type { ClientPersonalityType } from "@/modules/personality-closing/personality.types";

import type { ClosingFlowStep } from "./closing.types";

const STORAGE = "lecipm-closer-analytics-v1";

export type CloserAnalyticsAgg = {
  sessions: number;
  demosBooked: number;
  closeNowShown: number;
  closeNowAccepted: number;
  stepImpressions: Partial<Record<ClosingFlowStep, number>>;
  personalityOutcomes: Partial<Record<ClientPersonalityType, { tries: number; wins: number }>>;
};

function load(): CloserAnalyticsAgg {
  if (typeof localStorage === "undefined") {
    return emptyAgg();
  }
  try {
    const raw = localStorage.getItem(STORAGE);
    if (!raw) return emptyAgg();
    return { ...emptyAgg(), ...JSON.parse(raw) } as CloserAnalyticsAgg;
  } catch {
    return emptyAgg();
  }
}

function emptyAgg(): CloserAnalyticsAgg {
  return {
    sessions: 0,
    demosBooked: 0,
    closeNowShown: 0,
    closeNowAccepted: 0,
    stepImpressions: {},
    personalityOutcomes: {},
  };
}

function save(agg: CloserAnalyticsAgg) {
  try {
    localStorage.setItem(STORAGE, JSON.stringify(agg));
  } catch {
    /* ignore */
  }
}

export function recordCloserStepView(step: ClosingFlowStep): void {
  const agg = load();
  agg.stepImpressions[step] = (agg.stepImpressions[step] ?? 0) + 1;
  save(agg);
}

export function recordCloserSessionEnd(won: boolean, personality?: ClientPersonalityType): void {
  const agg = load();
  agg.sessions += 1;
  if (won) agg.demosBooked += 1;
  if (personality) {
    agg.personalityOutcomes[personality] = agg.personalityOutcomes[personality] ?? { tries: 0, wins: 0 };
    agg.personalityOutcomes[personality]!.tries += 1;
    if (won) agg.personalityOutcomes[personality]!.wins += 1;
  }
  save(agg);
}

export function recordCloseNowSignal(shown: boolean, accepted?: boolean): void {
  const agg = load();
  if (shown) agg.closeNowShown += 1;
  if (accepted) agg.closeNowAccepted += 1;
  save(agg);
}

export function loadCloserAnalytics(): CloserAnalyticsAgg {
  return load();
}

export function closerDemoRate(): number {
  const a = load();
  return a.sessions > 0 ? a.demosBooked / a.sessions : 0;
}
