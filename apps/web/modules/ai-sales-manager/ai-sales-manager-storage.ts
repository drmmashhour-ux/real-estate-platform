import type {
  AssignmentRecord,
  CoachingRecommendation,
  PerformanceForecast,
  SalesAlert,
  SalesProfile,
} from "./ai-sales-manager.types";

const STORAGE_KEY = "lecipm-ai-sales-manager-v1";

export type AiSalesManagerStore = {
  profiles: Record<string, SalesProfile>;
  /** userId -> recent recommendations */
  recommendationsByUser: Record<string, CoachingRecommendation[]>;
  forecastsByUser: Record<string, PerformanceForecast>;
  alertHistory: SalesAlert[];
  assignments: AssignmentRecord[];
};

function empty(): AiSalesManagerStore {
  return {
    profiles: {},
    recommendationsByUser: {},
    forecastsByUser: {},
    alertHistory: [],
    assignments: [],
  };
}

let memoryStore: AiSalesManagerStore = empty();

export function loadAiSalesStore(): AiSalesManagerStore {
  if (typeof localStorage !== "undefined") {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) memoryStore = { ...empty(), ...JSON.parse(raw) } as AiSalesManagerStore;
    } catch {
      /* keep memory */
    }
  }
  return memoryStore;
}

export function saveAiSalesStore(store: AiSalesManagerStore): void {
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
  return typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `asm-${Date.now()}`;
}

/** Test helper — reset store */
export function resetAiSalesStoreForTests(): void {
  memoryStore = empty();
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* noop */
    }
  }
}
