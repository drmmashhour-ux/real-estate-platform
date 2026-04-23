import type {
  LaunchStep,
  ProgressSummary,
  StepExecutionRecord,
  StepStatus,
  TerritoryPerformanceMetrics,
} from "./city-launch.types";

const STORAGE_KEY = "lecipm-city-launch-progress-v1";

export type TerritoryProgressStore = {
  stepRecords: Record<string, StepExecutionRecord>;
  metrics: TerritoryPerformanceMetrics;
  startedAtIso?: string;
};

export type CityLaunchProgressRoot = {
  territories: Record<string, TerritoryProgressStore>;
};

function emptyRoot(): CityLaunchProgressRoot {
  return { territories: {} };
}

let memory: CityLaunchProgressRoot = emptyRoot();

function loadRoot(): CityLaunchProgressRoot {
  if (typeof localStorage !== "undefined") {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) memory = { ...emptyRoot(), ...JSON.parse(raw) } as CityLaunchProgressRoot;
    } catch {
      /* ignore */
    }
  }
  return memory;
}

function saveRoot(r: CityLaunchProgressRoot): void {
  memory = r;
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(r));
    } catch {
      /* quota */
    }
  }
}

export function resetCityLaunchProgressForTests(): void {
  memory = emptyRoot();
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* noop */
    }
  }
}

function ensureTerritory(territoryId: string): TerritoryProgressStore {
  const root = loadRoot();
  if (!root.territories[territoryId]) {
    root.territories[territoryId] = {
      stepRecords: {},
      metrics: defaultMetrics(),
      startedAtIso: new Date().toISOString(),
    };
    saveRoot(root);
  }
  return loadRoot().territories[territoryId]!;
}

export function defaultMetrics(): TerritoryPerformanceMetrics {
  const now = new Date().toISOString();
  return {
    leadsGenerated: 0,
    brokersOnboarded: 0,
    listingsCreated: 0,
    bookingsBnhub: 0,
    dealsClosed: 0,
    revenueCents: 0,
    growthRate: 0,
    updatedAtIso: now,
  };
}

export function getTerritoryMetrics(territoryId: string): TerritoryPerformanceMetrics {
  return { ...ensureTerritory(territoryId).metrics };
}

export function patchTerritoryMetrics(
  territoryId: string,
  patch: Partial<Omit<TerritoryPerformanceMetrics, "updatedAtIso">>
): TerritoryPerformanceMetrics {
  const root = loadRoot();
  const t = ensureTerritory(territoryId);
  t.metrics = {
    ...t.metrics,
    ...patch,
    updatedAtIso: new Date().toISOString(),
  };
  root.territories[territoryId] = t;
  saveRoot(root);
  return t.metrics;
}

export function getStepRecord(territoryId: string, stepId: string): StepExecutionRecord | undefined {
  const t = ensureTerritory(territoryId);
  return t.stepRecords[stepId] ? { ...t.stepRecords[stepId] } : undefined;
}

export function upsertStepRecord(
  territoryId: string,
  patch: Partial<StepExecutionRecord> & { stepId: string }
): StepExecutionRecord {
  const root = loadRoot();
  const t = ensureTerritory(territoryId);
  const prev = t.stepRecords[patch.stepId];
  const next: StepExecutionRecord = {
    stepId: patch.stepId,
    status: patch.status ?? prev?.status ?? "pending",
    assignedTo: patch.assignedTo ?? prev?.assignedTo,
    notes: patch.notes ?? prev?.notes,
    resultNotes: patch.resultNotes ?? prev?.resultNotes,
    updatedAtIso: new Date().toISOString(),
    completedAtIso:
      patch.status === "completed"
        ? patch.completedAtIso ?? new Date().toISOString()
        : patch.completedAtIso ?? prev?.completedAtIso,
  };
  t.stepRecords[patch.stepId] = next;
  root.territories[territoryId] = t;
  saveRoot(root);
  return next;
}

export function setStepStatus(
  territoryId: string,
  stepId: string,
  status: StepStatus,
  extra?: Partial<Pick<StepExecutionRecord, "assignedTo" | "notes" | "resultNotes">>
): StepExecutionRecord {
  return upsertStepRecord(territoryId, {
    stepId,
    status,
    ...extra,
  });
}

export function buildProgressSummary(territoryId: string, steps: LaunchStep[]): ProgressSummary {
  const t = ensureTerritory(territoryId);
  const records = t.stepRecords;
  let completed = 0;
  let inProg = 0;
  let blocked = 0;
  let pending = 0;

  for (const s of steps) {
    const r = records[s.id]?.status ?? "pending";
    if (r === "completed") completed++;
    else if (r === "in_progress") inProg++;
    else if (r === "blocked") blocked++;
    else pending++;
  }

  const total = steps.length || 1;
  const pct = Math.round((completed / total) * 100);

  const started = t.startedAtIso ? new Date(t.startedAtIso).getTime() : Date.now();
  const weeks = Math.max(1, (Date.now() - started) / (7 * 24 * 3600 * 1000));
  const velocity = completed / weeks;

  const delays: string[] = [];
  const risks: string[] = [];
  for (const s of steps) {
    const r = records[s.id];
    if (r?.status === "blocked") {
      delays.push(`${s.title}: blocked — ${r.notes ?? "see notes"}`);
    }
    if (s.priority === "P0" && r?.status !== "completed" && r?.status !== "in_progress") {
      risks.push(`P0 step still pending: ${s.title}`);
    }
  }

  return {
    territoryId,
    totalSteps: steps.length,
    completedCount: completed,
    inProgressCount: inProg,
    blockedCount: blocked,
    pendingCount: pending,
    completionPercent: pct,
    velocityStepsPerWeek: Math.round(velocity * 10) / 10,
    delays,
    riskAreas: risks.slice(0, 8),
    startedAtIso: t.startedAtIso,
  };
}
