import type {
  ApprovalLogEntry,
  LearningState,
  MarketingAiAlert,
  MarketingAutonomyLevel,
  QueueItem,
  WeeklyPlan,
} from "./marketing-ai.types";

const STORAGE_KEY = "lecipm-marketing-ai-v1";

export type MarketingAiStore = {
  autonomyLevel: MarketingAutonomyLevel;
  weeklyPlan: WeeklyPlan | null;
  queue: QueueItem[];
  approvalLogs: ApprovalLogEntry[];
  learning: LearningState;
  alerts: MarketingAiAlert[];
};

function defaultLearning(): LearningState {
  return {
    platformScores: {},
    typeScores: {},
    audienceScores: {},
    slotScores: {},
    hookTemplateScores: {},
    samples: 0,
    updatedAtIso: new Date().toISOString(),
  };
}

export function emptyMarketingAiStore(): MarketingAiStore {
  return {
    autonomyLevel: "ASSIST",
    weeklyPlan: null,
    queue: [],
    approvalLogs: [],
    learning: defaultLearning(),
    alerts: [],
  };
}

let memory: MarketingAiStore = emptyMarketingAiStore();

export function loadMarketingAiStore(): MarketingAiStore {
  if (typeof localStorage !== "undefined") {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<MarketingAiStore>;
        memory = {
          ...emptyMarketingAiStore(),
          ...parsed,
          learning: { ...defaultLearning(), ...parsed.learning },
        };
      }
    } catch {
      /* ignore */
    }
  }
  return memory;
}

export function saveMarketingAiStore(store: MarketingAiStore): void {
  memory = store;
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch {
      /* quota */
    }
  }
}

export function uid(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `mai-${Date.now()}`;
}

export function resetMarketingAiStoreForTests(): void {
  memory = emptyMarketingAiStore();
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* noop */
    }
  }
}
