import type { RevenueFinancialSnapshot } from "./revenue-predictor.types";

const STORAGE_KEY = "lecipm-revenue-predictor-v1";

export type RevenuePredictorStore = {
  snapshots: Record<string, RevenueFinancialSnapshot>;
  /** teamId -> last aggregated base forecast cents for WoW alerts */
  lastTeamForecastCents: Record<string, number>;
  /** userId -> last base forecast */
  lastRepForecastCents: Record<string, number>;
};

function empty(): RevenuePredictorStore {
  return {
    snapshots: {},
    lastTeamForecastCents: {},
    lastRepForecastCents: {},
  };
}

let memoryStore: RevenuePredictorStore = empty();

export function loadRevenuePredictorStore(): RevenuePredictorStore {
  if (typeof localStorage !== "undefined") {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) memoryStore = { ...empty(), ...JSON.parse(raw) } as RevenuePredictorStore;
    } catch {
      /* keep memory */
    }
  }
  return memoryStore;
}

export function saveRevenuePredictorStore(store: RevenuePredictorStore): void {
  memoryStore = store;
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch {
      /* quota */
    }
  }
}

export function uid(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `rp-${Date.now()}`;
}

export function resetRevenuePredictorStoreForTests(): void {
  memoryStore = empty();
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* noop */
    }
  }
}
