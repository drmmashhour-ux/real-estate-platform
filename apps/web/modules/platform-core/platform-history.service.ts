import { prisma } from "@/lib/db";
import { logWarn } from "@/lib/logger";
import { platformCoreFlags } from "@/config/feature-flags";
import {
  getDecisionById,
  listApprovalsForDecision,
  listAuditEvents,
  listDecisions,
  listTasks,
} from "./platform-core.repository";
import { getPlatformCoreHealth } from "./platform-health.service";
import type {
  CoreDecisionDependency,
  CoreDecisionPriority,
  CoreDecisionRecord,
  CoreDecisionSimulationResult,
  CoreEntityType,
} from "./platform-core.types";
import { resolveDashboardBrainPayload } from "./brain-v8-dashboard-brain-resolve";
import { getBrainV8PrimaryMonitoringSnapshot } from "./brain-v8-primary-monitoring.service";
import { detectDecisionDependencies } from "./platform-core-dependency.service";
import { detectCoreConflicts, type CoreConflictFinding } from "./platform-core-conflict.service";
import { simulateDecisionImpact } from "./platform-core-simulation.service";

export type PlatformCoreDashboardOrchestration = {
  priorityByDecisionId: Record<string, CoreDecisionPriority & { storedAt?: string }>;
  nextRunByDecisionId: Record<string, string>;
  dependencyOutgoing: Record<string, number>;
  dependencyIncoming: Record<string, number>;
  detectedEdges: CoreDecisionDependency[];
  conflictFindings: CoreConflictFinding[];
  simulationsByDecisionId: Record<string, CoreDecisionSimulationResult | null>;
};

async function loadOrchestrationForDecisions(
  decisions: CoreDecisionRecord[],
): Promise<PlatformCoreDashboardOrchestration> {
  const empty: PlatformCoreDashboardOrchestration = {
    priorityByDecisionId: {},
    nextRunByDecisionId: {},
    dependencyOutgoing: {},
    dependencyIncoming: {},
    detectedEdges: [],
    conflictFindings: [],
    simulationsByDecisionId: {},
  };
  if (!platformCoreFlags.platformCoreV1) return empty;
  const ids = decisions.map((d) => d.id);
  if (ids.length === 0) return empty;

  try {
  const [priorityRows, scheduleRows, depRows] = await Promise.all([
    platformCoreFlags.platformCorePriorityV1 ?
      prisma.platformCoreDecisionPriority.findMany({
        where: { decisionId: { in: ids } },
        orderBy: { createdAt: "desc" },
      })
    : [],
    platformCoreFlags.platformCoreSchedulerV1 ?
      prisma.platformCoreDecisionSchedule.findMany({ where: { decisionId: { in: ids } } })
    : [],
    platformCoreFlags.platformCoreDependenciesV1 ?
      prisma.platformCoreDecisionDependency.findMany({
        where: { OR: [{ decisionId: { in: ids } }, { dependsOnDecisionId: { in: ids } }] },
      })
    : [],
  ]);

  const clampPriorityMetric = (x: number) =>
    typeof x === "number" && Number.isFinite(x) ? Math.min(1, Math.max(0, x)) : 0;
  const priorityByDecisionId: PlatformCoreDashboardOrchestration["priorityByDecisionId"] = {};
  for (const p of priorityRows) {
    if (priorityByDecisionId[p.decisionId]) continue;
    const meta = p.metadata && typeof p.metadata === "object" ? (p.metadata as Record<string, unknown>) : {};
    priorityByDecisionId[p.decisionId] = {
      priorityScore: clampPriorityMetric(p.priorityScore),
      urgency: clampPriorityMetric(p.urgency),
      impact: clampPriorityMetric(p.impact),
      confidence: clampPriorityMetric(p.confidence),
      reason: typeof meta.reason === "string" ? meta.reason : "priority snapshot",
      storedAt: p.createdAt.toISOString(),
    };
  }

  const nextRunByDecisionId: Record<string, string> = {};
  for (const s of scheduleRows) {
    nextRunByDecisionId[s.decisionId] = s.nextRunAt.toISOString();
  }

  const idSet = new Set(ids);
  const dependencyOutgoing: Record<string, number> = {};
  const dependencyIncoming: Record<string, number> = {};
  for (const id of ids) {
    dependencyOutgoing[id] = 0;
    dependencyIncoming[id] = 0;
  }
  for (const e of depRows) {
    if (idSet.has(e.decisionId)) dependencyOutgoing[e.decisionId] = (dependencyOutgoing[e.decisionId] ?? 0) + 1;
    if (idSet.has(e.dependsOnDecisionId)) {
      dependencyIncoming[e.dependsOnDecisionId] = (dependencyIncoming[e.dependsOnDecisionId] ?? 0) + 1;
    }
  }

  const detectedEdges = platformCoreFlags.platformCoreDependenciesV1 ? detectDecisionDependencies(decisions) : [];
  const conflictFindings = detectCoreConflicts(decisions);

  const simulationsByDecisionId: Record<string, CoreDecisionSimulationResult | null> = {};
  if (platformCoreFlags.platformCoreSimulationV1) {
    for (const d of decisions.slice(0, 24)) {
      try {
        simulationsByDecisionId[d.id] = simulateDecisionImpact(d);
      } catch (e) {
        logWarn("[platform-core:dashboard]", "simulation_row_skipped", {
          decisionId: d.id,
          message: e instanceof Error ? e.message : String(e),
        });
        simulationsByDecisionId[d.id] = null;
      }
    }
  }

  return {
    priorityByDecisionId,
    nextRunByDecisionId,
    dependencyOutgoing,
    dependencyIncoming,
    detectedEdges,
    conflictFindings,
    simulationsByDecisionId,
  };
  } catch (e) {
    logWarn("[platform-core:dashboard]", "loadOrchestrationForDecisions_failed", {
      message: e instanceof Error ? e.message : String(e),
    });
    return empty;
  }
}

export async function getPlatformDecisionTimeline(entityType: CoreEntityType, entityId: string) {
  const rows = await prisma.platformCoreDecision.findMany({
    where: { entityType, entityId },
    orderBy: { createdAt: "desc" },
    take: 80,
  });
  const out: Array<{ decision: CoreDecisionRecord; approvals: Awaited<ReturnType<typeof listApprovalsForDecision>> }> =
    [];
  for (const r of rows) {
    const d = await getDecisionById(r.id);
    if (!d) continue;
    const approvals = await listApprovalsForDecision(r.id);
    out.push({ decision: d, approvals });
  }
  return out;
}

export async function getRecentPlatformActivity(limit = 40) {
  return listAuditEvents({ limit });
}

export async function getPlatformSummary() {
  const [pending, approved, blocked, executed, dismissed, monitoring] = await Promise.all([
    prisma.platformCoreDecision.count({ where: { status: "PENDING" } }),
    prisma.platformCoreDecision.count({ where: { status: "APPROVED" } }),
    prisma.platformCoreDecision.count({ where: { status: "BLOCKED" } }),
    prisma.platformCoreDecision.count({ where: { status: "EXECUTED" } }),
    prisma.platformCoreDecision.count({ where: { status: "DISMISSED" } }),
    prisma.platformCoreDecision.count({ where: { status: "MONITORING" } }),
  ]);

  const [queued, running, failed, succeeded] = await Promise.all([
    prisma.platformCoreTask.count({ where: { status: "QUEUED" } }),
    prisma.platformCoreTask.count({ where: { status: "RUNNING" } }),
    prisma.platformCoreTask.count({ where: { status: "FAILED" } }),
    prisma.platformCoreTask.count({ where: { status: "SUCCEEDED" } }),
  ]);

  return {
    decisions: { pending, approved, blocked, executed, dismissed, monitoring },
    tasks: { queued, running, failed, succeeded },
  };
}

export async function getPendingApprovalsSummary() {
  const n = await prisma.platformCoreDecision.count({ where: { status: "PENDING" } });
  return { count: n };
}

export async function getExecutionSummary() {
  const [executed, failed, rolledBack] = await Promise.all([
    prisma.platformCoreDecision.count({ where: { status: "EXECUTED" } }),
    prisma.platformCoreDecision.count({ where: { status: "FAILED" } }),
    prisma.platformCoreDecision.count({ where: { status: "ROLLED_BACK" } }),
  ]);
  return { executed, failed, rolledBack };
}

export async function loadPlatformCoreDashboardPayload() {
  const [decisions, tasks, audit, summary, health, brain] = await Promise.all([
    listDecisions({ limit: 50 }),
    listTasks({ limit: 40 }),
    listAuditEvents({ limit: 60 }),
    getPlatformSummary(),
    getPlatformCoreHealth(),
    resolveDashboardBrainPayload("legacy_snapshot"),
  ]);
  const orchestration = await loadOrchestrationForDecisions(decisions);
  const brainV8PrimaryMonitoring = getBrainV8PrimaryMonitoringSnapshot();
  return { decisions, tasks, audit, summary, health, brain, brainV8PrimaryMonitoring, orchestration };
}

/** Opt-in: same dashboard as {@link loadPlatformCoreDashboardPayload} but brain slice uses V8 Phase C/D routing. */
export async function loadPlatformCoreDashboardPayloadWithBrainV8Overlay() {
  const [decisions, tasks, audit, summary, health, brain] = await Promise.all([
    listDecisions({ limit: 50 }),
    listTasks({ limit: 40 }),
    listAuditEvents({ limit: 60 }),
    getPlatformSummary(),
    getPlatformCoreHealth(),
    resolveDashboardBrainPayload("v8_overlay"),
  ]);
  const orchestration = await loadOrchestrationForDecisions(decisions);
  const brainV8PrimaryMonitoring = getBrainV8PrimaryMonitoringSnapshot();
  return { decisions, tasks, audit, summary, health, brain, brainV8PrimaryMonitoring, orchestration };
}
