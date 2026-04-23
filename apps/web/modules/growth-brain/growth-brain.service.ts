import { allocateAttention } from "./growth-brain-allocation.service";
import { recommendActionsFromOpportunities } from "./growth-brain-actions.service";
import { buildGrowthAlerts } from "./growth-brain-alerts.service";
import { buildExplainability } from "./growth-brain-explainability.service";
import { deriveLearnedPatterns, logActionOutcome } from "./growth-brain-learning.service";
import { prioritizeOpportunities } from "./growth-brain-prioritization.service";
import { aggregateGrowthSignals } from "./growth-brain-signals.service";
import type {
  ApprovalQueueItem,
  GrowthAction,
  GrowthAutonomyLevel,
  GrowthBrainSnapshot,
  GrowthOpportunity,
} from "./growth-brain.types";

const BRAIN_KEY = "lecipm-growth-brain-v1";

export type GrowthBrainState = {
  autonomy: GrowthAutonomyLevel;
  approvalQueue: ApprovalQueueItem[];
  lastSnapshotAt?: string;
};

function defaultState(): GrowthBrainState {
  return { autonomy: "ASSIST", approvalQueue: [] };
}

let stateMem: GrowthBrainState = defaultState();

function loadState(): GrowthBrainState {
  if (typeof localStorage !== "undefined") {
    try {
      const raw = localStorage.getItem(BRAIN_KEY);
      if (raw) {
        const p = JSON.parse(raw) as Partial<GrowthBrainState>;
        stateMem = { ...defaultState(), ...p, approvalQueue: p.approvalQueue ?? [] };
      }
    } catch {
      /* ignore */
    }
  }
  return stateMem;
}

function saveState(s: GrowthBrainState): void {
  stateMem = s;
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.setItem(BRAIN_KEY, JSON.stringify(s));
    } catch {
      /* quota */
    }
  }
}

export function getGrowthAutonomy(): GrowthAutonomyLevel {
  return loadState().autonomy;
}

export function setGrowthAutonomy(level: GrowthAutonomyLevel): void {
  const s = loadState();
  s.autonomy = level;
  saveState(s);
}

export function getApprovalQueue(): ApprovalQueueItem[] {
  return loadState().approvalQueue;
}

export function updateApprovalItem(
  id: string,
  status: "approved" | "rejected"
): ApprovalQueueItem | null {
  const s = loadState();
  const it = s.approvalQueue.find((q) => q.id === id);
  if (!it) return null;
  it.status = status;
  it.decidedAtIso = new Date().toISOString();
  saveState(s);
  if (status === "approved") {
    logActionOutcome({
      actionId: it.actionId,
      actionType: "APPROVAL_REQUEST",
      outcome: "approved",
    });
  } else {
    logActionOutcome({ actionId: it.actionId, actionType: "APPROVAL_REQUEST", outcome: "skipped" });
  }
  return it;
}

function buildApprovalQueueFromActions(actions: GrowthAction[]): ApprovalQueueItem[] {
  return actions
    .filter((a) => a.approvalRequired)
    .map((a) => ({
      id: `apr-${a.opportunityId}-${a.actionType}`,
      actionId: a.id,
      title: a.actionType.replace(/_/g, " "),
      summary: a.reason,
      riskLevel: a.riskLevel,
      status: "pending" as const,
      createdAtIso: new Date().toISOString(),
    }));
}

export function syncApprovalQueueWithActions(actions: GrowthAction[]): void {
  const s = loadState();
  const fresh = buildApprovalQueueFromActions(actions);
  const byId = new Map<string, ApprovalQueueItem>();

  for (const q of s.approvalQueue) {
    byId.set(q.id, q);
  }
  for (const f of fresh) {
    const existing = byId.get(f.id);
    if (existing && existing.status !== "pending") {
      continue;
    }
    byId.set(f.id, f);
  }

  s.approvalQueue = [...byId.values()]
    .sort((a, b) => (b.createdAtIso || "").localeCompare(a.createdAtIso || ""))
    .slice(0, 50);
  saveState(s);
}

export function runGrowthBrainSnapshot(): GrowthBrainSnapshot {
  const signals = aggregateGrowthSignals();
  const opportunities = prioritizeOpportunities(signals);
  const autonomy = getGrowthAutonomy();
  const actions = recommendActionsFromOpportunities(opportunities, autonomy, 6);
  const allocation = allocateAttention(
    opportunities,
    opportunities.map((o) => o.region).filter(Boolean) as string[]
  );
  const { strong, weak } = deriveLearnedPatterns();
  const alerts = buildGrowthAlerts(signals, opportunities, false);

  syncApprovalQueueWithActions(actions);

  const snap: GrowthBrainSnapshot = {
    autonomy,
    signals,
    opportunities,
    actions,
    allocation,
    alerts,
    approvalQueue: getApprovalQueue(),
    learnedPatterns: strong,
    weakPatterns: weak,
    generatedAtIso: new Date().toISOString(),
  };

  const st = loadState();
  st.lastSnapshotAt = snap.generatedAtIso;
  saveState(st);

  return snap;
}

export function explainTopOpportunity(snapshot: GrowthBrainSnapshot) {
  const top = snapshot.opportunities[0];
  if (!top) return null;
  return buildExplainability(
    top,
    snapshot.signals.filter((s) => top.sourceSignalIds.includes(s.signalId))
  );
}

export function resetGrowthBrainStateForTests(): void {
  stateMem = defaultState();
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.removeItem(BRAIN_KEY);
    } catch {
      /* noop */
    }
  }
}

/** Re-export learning outcome logger for UI */
export { logActionOutcome };
