/**
 * Lightweight internal execution state — in-memory + optional JSON file (broker-pipeline style).
 * Advisory only; does not execute product changes.
 */

import fs from "fs";
import path from "path";

import type {
  PlatformImprovementOperatorStateDocument,
  StoredOperatorPriorityRow,
} from "./platform-improvement-operator-state.types";
import type {
  PlatformImprovementBundle,
  PlatformImprovementFollowThroughSummary,
  PlatformImprovementPriority,
  PlatformImprovementPriorityHistoryEvent,
  PlatformImprovementPriorityHistoryEventKind,
  PlatformPriorityRecord,
  PlatformPriorityStatus,
} from "./platform-improvement.types";
import { isTransitionAllowed } from "./platform-improvement-operator-transitions";

const MAX_PRIORITIES = 500;
const MAX_HISTORY_EVENTS = 250;

export type PlatformImprovementHistoryEvent = {
  at: string;
  priorityId: string;
  from: PlatformPriorityStatus;
  to: PlatformPriorityStatus;
};

type StoredPriorityV2 = StoredOperatorPriorityRow & {
  createdAt: string;
  updatedAt: string;
  acknowledgedAt?: string;
  plannedAt?: string;
  startedAt?: string;
  completedAt?: string;
  dismissedAt?: string;
};

type StateDocV2 = {
  version: 2;
  priorities: Record<string, StoredPriorityV2>;
  historyEvents: PlatformImprovementHistoryEvent[];
  updatedAt: string;
};

const memoryPriorities = new Map<string, StoredPriorityV2>();
let memoryHistory: PlatformImprovementHistoryEvent[] = [];
let loaded = false;

function defaultDataPath(): string {
  return path.join(process.cwd(), "data", "platform-improvement-state.json");
}

function legacyDataPath(): string {
  return path.join(process.cwd(), "data", "platform-improvement-operator-state.json");
}

function envDataPath(): string | null {
  const raw = process.env.PLATFORM_IMPROVEMENT_STATE_JSON_PATH?.trim();
  if (!raw) return null;
  return path.isAbsolute(raw) ? raw : path.join(process.cwd(), raw);
}

function resolvedWritePath(): string {
  return envDataPath() ?? defaultDataPath();
}

function nowIso(): string {
  return new Date().toISOString();
}

function historyKindForStatus(s: PlatformPriorityStatus): PlatformImprovementPriorityHistoryEventKind {
  return s as PlatformImprovementPriorityHistoryEventKind;
}

function migrateV1ToV2(v1: PlatformImprovementOperatorStateDocument): StateDocV2 {
  const priorities: Record<string, StoredPriorityV2> = {};
  for (const [id, row] of Object.entries(v1.priorities)) {
    const surfaced = row.history.find((h) => h.kind === "surfaced")?.at ?? v1.updatedAt;
    priorities[id] = {
      status: row.status,
      history: row.history,
      createdAt: surfaced,
      updatedAt: v1.updatedAt,
    };
  }
  return {
    version: 2,
    priorities,
    historyEvents: [],
    updatedAt: nowIso(),
  };
}

function loadFromDisk(): void {
  if (loaded) return;
  loaded = true;
  const tryPaths = [resolvedWritePath(), defaultDataPath(), legacyDataPath()];
  for (const fp of tryPaths) {
    if (!fp || !fs.existsSync(fp)) continue;
    try {
      const raw = fs.readFileSync(fp, "utf8");
      const parsed = JSON.parse(raw) as unknown;
      if (!parsed || typeof parsed !== "object") continue;
      const o = parsed as Record<string, unknown>;
      if (o.version === 2) {
        const doc = parsed as StateDocV2;
        memoryPriorities.clear();
        for (const [id, row] of Object.entries(doc.priorities ?? {})) {
          memoryPriorities.set(id, row);
        }
        memoryHistory = Array.isArray(doc.historyEvents) ? doc.historyEvents.slice(-MAX_HISTORY_EVENTS) : [];
        return;
      }
      if (o.version === 1) {
        const migrated = migrateV1ToV2(parsed as PlatformImprovementOperatorStateDocument);
        memoryPriorities.clear();
        for (const [id, row] of Object.entries(migrated.priorities)) {
          memoryPriorities.set(id, row);
        }
        memoryHistory = [];
        persistToDisk();
        return;
      }
    } catch {
      /* ignore */
    }
  }
}

export function getPlatformImprovementPersistenceMeta(): {
  jsonPathConfigured: boolean;
  persistenceMode: "memory" | "json_file";
  writePath: string;
} {
  const jsonPathConfigured = Boolean(envDataPath());
  const writePath = resolvedWritePath();
  return {
    jsonPathConfigured,
    persistenceMode: "json_file",
    writePath,
  };
}

function persistToDisk(): void {
  const fp = resolvedWritePath();
  try {
    fs.mkdirSync(path.dirname(fp), { recursive: true });
    const doc: StateDocV2 = {
      version: 2,
      priorities: Object.fromEntries(memoryPriorities.entries()),
      historyEvents: memoryHistory.slice(-MAX_HISTORY_EVENTS),
      updatedAt: nowIso(),
    };
    fs.writeFileSync(fp, `${JSON.stringify(doc, null, 2)}\n`, "utf8");
  } catch {
    /* read-only FS */
  }
}

function touchTimestamps(row: StoredPriorityV2, next: PlatformPriorityStatus, at: string): void {
  row.updatedAt = at;
  switch (next) {
    case "acknowledged":
      row.acknowledgedAt = row.acknowledgedAt ?? at;
      break;
    case "planned":
      row.plannedAt = row.plannedAt ?? at;
      break;
    case "in_progress":
      row.startedAt = row.startedAt ?? at;
      break;
    case "done":
      row.completedAt = at;
      break;
    case "dismissed":
      row.dismissedAt = at;
      break;
    default:
      break;
  }
}

function appendGlobalHistory(e: PlatformImprovementHistoryEvent): void {
  memoryHistory.push(e);
  if (memoryHistory.length > MAX_HISTORY_EVENTS) {
    memoryHistory = memoryHistory.slice(-MAX_HISTORY_EVENTS);
  }
}

export function resetPlatformImprovementStateForTests(): void {
  memoryPriorities.clear();
  memoryHistory = [];
  /** Skip reading persisted JSON on next call — keeps vitest deterministic when a dev JSON file exists. */
  loaded = true;
}

/** Merge stored row + engine priority into operator record. */
export function buildPlatformPriorityRecord(
  priority: PlatformImprovementPriority,
  row: StoredPriorityV2 | undefined,
  fallbackCreatedAt: string,
): PlatformPriorityRecord {
  const status: PlatformPriorityStatus = row?.status ?? "new";
  const createdAt = row?.createdAt ?? fallbackCreatedAt;
  const updatedAt = row?.updatedAt ?? fallbackCreatedAt;
  return {
    id: priority.id,
    title: priority.title,
    category: priority.category,
    urgency: priority.urgency,
    impact: priority.expectedImpact,
    status,
    createdAt,
    updatedAt,
    acknowledgedAt: row?.acknowledgedAt,
    plannedAt: row?.plannedAt,
    startedAt: row?.startedAt,
    completedAt: row?.completedAt,
    dismissedAt: row?.dismissedAt,
  };
}

export function statusesByPriorityIdFromDoc(): Record<string, PlatformPriorityStatus> {
  loadFromDisk();
  const out: Record<string, PlatformPriorityStatus> = {};
  for (const [id, row] of memoryPriorities.entries()) {
    out[id] = row.status;
  }
  return out;
}

export function getStoredPriorityStatus(id: string): PlatformPriorityStatus | undefined {
  loadFromDisk();
  return memoryPriorities.get(id)?.status;
}

export function getPriorityState(id: string, bundle: PlatformImprovementBundle): PlatformPriorityRecord | null {
  loadFromDisk();
  const p = bundle.priorities.find((x) => x.id === id);
  if (!p) return null;
  const row = memoryPriorities.get(id);
  return buildPlatformPriorityRecord(p, row, bundle.createdAt);
}

export function listPriorityStates(bundle: PlatformImprovementBundle): PlatformPriorityRecord[] {
  loadFromDisk();
  return bundle.priorities.map((p) =>
    buildPlatformPriorityRecord(p, memoryPriorities.get(p.id), bundle.createdAt),
  );
}

export function updatePriorityTimestamp(id: string, _field: "updatedAt"): boolean {
  loadFromDisk();
  const row = memoryPriorities.get(id);
  if (!row) return false;
  row.updatedAt = nowIso();
  memoryPriorities.set(id, row);
  persistToDisk();
  return true;
}

export async function setPriorityStatus(
  id: string,
  next: PlatformPriorityStatus,
): Promise<{ ok: true } | { ok: false; error: string }> {
  loadFromDisk();
  const row = memoryPriorities.get(id);
  if (!row) {
    return { ok: false, error: "Unknown priority id — refresh the page after new priorities surface." };
  }
  const from = row.status;
  if (!isTransitionAllowed(from, next)) {
    return { ok: false, error: `Cannot move from "${from}" to "${next}".` };
  }
  const at = nowIso();
  row.status = next;
  row.history = [...row.history, { at, kind: historyKindForStatus(next) }];
  touchTimestamps(row, next, at);
  memoryPriorities.set(id, row);
  appendGlobalHistory({ at, priorityId: id, from, to: next });
  persistToDisk();
  return { ok: true };
}

export function listRecentHistory(limit = 40): PlatformImprovementHistoryEvent[] {
  loadFromDisk();
  return memoryHistory.slice(-limit).reverse();
}

export function syncExecutionStateWithBundle(bundle: PlatformImprovementBundle): void {
  loadFromDisk();
  let changed = false;
  if (bundle.priorities.length > MAX_PRIORITIES) {
    /* bounded */
  }
  for (const p of bundle.priorities) {
    if (memoryPriorities.has(p.id)) continue;
    const at = bundle.createdAt;
    const row: StoredPriorityV2 = {
      status: "new",
      history: [{ at, kind: "surfaced" }],
      createdAt: at,
      updatedAt: at,
    };
    memoryPriorities.set(p.id, row);
    changed = true;
  }
  if (changed) persistToDisk();
}

export function computeExecutionFollowThrough(
  priorities: PlatformImprovementPriority[],
): PlatformImprovementFollowThroughSummary {
  loadFromDisk();
  const total = priorities.length;
  let newCount = 0;
  let acknowledged = 0;
  let planned = 0;
  let inProgress = 0;
  let completed = 0;
  let dismissed = 0;
  for (const p of priorities) {
    const row = memoryPriorities.get(p.id);
    const status: PlatformPriorityStatus = row?.status ?? "new";
    switch (status) {
      case "new":
        newCount += 1;
        break;
      case "acknowledged":
        acknowledged += 1;
        break;
      case "planned":
        planned += 1;
        break;
      case "in_progress":
        inProgress += 1;
        break;
      case "done":
        completed += 1;
        break;
      case "dismissed":
        dismissed += 1;
        break;
      default:
        break;
    }
  }
  return {
    total,
    newCount,
    acknowledged,
    planned,
    inProgress,
    completed,
    dismissed,
  };
}

export type MergedExecutionRow = {
  priority: PlatformImprovementPriority;
  record: PlatformPriorityRecord;
  history: PlatformImprovementPriorityHistoryEvent[];
};

export type PlatformImprovementExecutionPanelModel = {
  merged: MergedExecutionRow[];
  followThrough: PlatformImprovementFollowThroughSummary;
  allResolved: boolean;
  noEnginePriorities: boolean;
};

export function buildExecutionPanelModel(bundle: PlatformImprovementBundle): PlatformImprovementExecutionPanelModel {
  loadFromDisk();
  const merged: MergedExecutionRow[] = bundle.priorities.map((priority) => {
    const row = memoryPriorities.get(priority.id);
    const fallbackSurfaced: PlatformImprovementPriorityHistoryEvent[] = [
      { at: bundle.createdAt, kind: "surfaced" },
    ];
    const safeHistory = row?.history?.length ? row.history : fallbackSurfaced;
    const record = buildPlatformPriorityRecord(priority, row, bundle.createdAt);
    return { priority, record, history: safeHistory };
  });
  const followThrough = computeExecutionFollowThrough(bundle.priorities);
  const activeLeft = bundle.priorities.filter((p) => {
    const s = memoryPriorities.get(p.id)?.status ?? "new";
    return s !== "done" && s !== "dismissed";
  }).length;
  const allResolved = bundle.priorities.length > 0 && activeLeft === 0;
  return {
    merged,
    followThrough,
    allResolved,
    noEnginePriorities: bundle.priorities.length === 0,
  };
}

/** Back-compat: async wrapper used by older routes. */
export async function syncOperatorStateWithBundle(bundle: PlatformImprovementBundle): Promise<void> {
  syncExecutionStateWithBundle(bundle);
}

/** Back-compat name for transition API. */
export async function transitionOperatorPriorityStatus(args: {
  priorityId: string;
  nextStatus: PlatformPriorityStatus;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  return setPriorityStatus(args.priorityId, args.nextStatus);
}
