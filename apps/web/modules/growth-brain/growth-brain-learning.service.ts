import type {
  ActionType,
  GrowthLearningRecord,
  LearnedPattern,
  LearningOutcomeKind,
} from "./growth-brain.types";
import { uid } from "./growth-brain-signals.service";

const STORAGE_KEY = "lecipm-growth-brain-learning-v1";

export type LearningStore = {
  outcomes: Record<string, GrowthLearningRecord>;
};

function emptyLearn(): LearningStore {
  return { outcomes: {} };
}

let memory: LearningStore = emptyLearn();

export function loadLearningStore(): LearningStore {
  if (typeof localStorage !== "undefined") {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) memory = { ...emptyLearn(), ...JSON.parse(raw) } as LearningStore;
    } catch {
      /* ignore */
    }
  }
  return memory;
}

export function saveLearningStore(store: LearningStore): void {
  memory = store;
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch {
      /* quota */
    }
  }
}

export function resetGrowthBrainLearningForTests(): void {
  memory = emptyLearn();
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* noop */
    }
  }
}

export function logActionOutcome(input: {
  actionId: string;
  actionType: ActionType;
  outcome: LearningOutcomeKind;
  revenueDeltaCents?: number;
  leadDelta?: number;
  conversionDelta?: number;
  hub?: string;
  region?: string;
}): GrowthLearningRecord {
  const rec: GrowthLearningRecord = {
    id: uid(),
    actionId: input.actionId,
    actionType: input.actionType,
    outcome: input.outcome,
    revenueDeltaCents: input.revenueDeltaCents,
    leadDelta: input.leadDelta,
    conversionDelta: input.conversionDelta,
    hub: input.hub,
    region: input.region,
    loggedAtIso: new Date().toISOString(),
  };
  const store = loadLearningStore();
  store.outcomes[rec.id] = rec;
  saveLearningStore(store);
  return rec;
}

export function listOutcomes(): GrowthLearningRecord[] {
  return Object.values(loadLearningStore().outcomes).sort((a, b) =>
    (b.loggedAtIso || "").localeCompare(a.loggedAtIso || "")
  );
}

/** Aggregate crude patterns from outcomes — explainable heuristics only */
export function deriveLearnedPatterns(): { strong: LearnedPattern[]; weak: LearnedPattern[] } {
  const outcomes = listOutcomes();
  const byType = new Map<ActionType, { wins: number; total: number }>();

  for (const o of outcomes) {
    const cur = byType.get(o.actionType) ?? { wins: 0, total: 0 };
    cur.total += 1;
    if (o.outcome === "executed" || o.outcome === "approved") {
      if ((o.revenueDeltaCents ?? 0) > 0 || (o.leadDelta ?? 0) > 0) cur.wins += 1;
    }
    byType.set(o.actionType, cur);
  }

  const strong: LearnedPattern[] = [];
  const weak: LearnedPattern[] = [];

  for (const [actionType, agg] of byType) {
    const rate = agg.total ? agg.wins / agg.total : 0;
    const pattern: LearnedPattern = {
      id: uid(),
      summary: `${actionType.replace(/_/g, " ")} shows ${(rate * 100).toFixed(0)}% positive uplift signals`,
      strength: rate,
      context: `${agg.wins}/${agg.total} tracked outcomes`,
    };
    if (rate >= 0.45 && agg.total >= 2) strong.push(pattern);
    else if (rate < 0.25 && agg.total >= 2) weak.push(pattern);
  }

  return { strong: strong.slice(0, 8), weak: weak.slice(0, 8) };
}
