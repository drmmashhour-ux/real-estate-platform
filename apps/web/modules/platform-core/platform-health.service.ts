import { prisma } from "@/lib/db";
import { platformCoreFlags } from "@/config/feature-flags";
import { PLATFORM_CORE_AUDIT } from "./platform-core.constants";

const STALE_MS = 24 * 60 * 60 * 1000;
const STALE_DECISION_MS = 48 * 60 * 60 * 1000;
const FAILED_TASK_WARN_THRESHOLD = 5;
const BLOCKED_WARN_THRESHOLD = 20;
const CONFLICT_AUDIT_WARN_THRESHOLD = 8;
const STALE_PENDING_DECISIONS_WARN_THRESHOLD = 25;
const BLOCKED_DEPS_WARN_THRESHOLD = 40;
const EXEC_SUCCESS_MIN_TOTAL = 10;
const EXEC_SUCCESS_RATIO_WARN = 0.45;

export type PlatformCoreHealth = {
  pendingDecisions: number;
  blockedDecisions: number;
  failedTasks: number;
  runningTasks: number;
  queuedTasks: number;
  recentAuditCount: number;
  warnings: string[];
};

export async function getPlatformCoreHealth(): Promise<PlatformCoreHealth> {
  const staleBefore = new Date(Date.now() - STALE_MS);

  const staleDecisionBefore = new Date(Date.now() - STALE_DECISION_MS);
  const conflictWindow = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [
    pendingDecisions,
    blockedDecisions,
    failedTasks,
    runningTasks,
    queuedTasks,
    recentAuditCount,
    staleQueued,
    stalePendingDecisions,
    conflictAudit24h,
    blockedDependencyEdges,
    executedDecisions,
    failedDecisions,
    overdueSchedules,
  ] = await Promise.all([
    prisma.platformCoreDecision.count({ where: { status: "PENDING" } }),
    prisma.platformCoreDecision.count({ where: { status: "BLOCKED" } }),
    prisma.platformCoreTask.count({ where: { status: "FAILED" } }),
    prisma.platformCoreTask.count({ where: { status: "RUNNING" } }),
    prisma.platformCoreTask.count({ where: { status: "QUEUED" } }),
    prisma.platformCoreAuditEvent.count({
      where: { createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) } },
    }),
    prisma.platformCoreTask.count({
      where: { status: "QUEUED", createdAt: { lt: staleBefore } },
    }),
    prisma.platformCoreDecision.count({
      where: { status: "PENDING", createdAt: { lt: staleDecisionBefore } },
    }),
    prisma.platformCoreAuditEvent.count({
      where: {
        eventType: PLATFORM_CORE_AUDIT.DECISION_CONFLICT,
        createdAt: { gte: conflictWindow },
      },
    }),
    platformCoreFlags.platformCoreDependenciesV1 ?
      prisma.platformCoreDecisionDependency.count({ where: { type: "BLOCKS" } })
    : Promise.resolve(0),
    prisma.platformCoreDecision.count({ where: { status: "EXECUTED" } }),
    prisma.platformCoreDecision.count({ where: { status: "FAILED" } }),
    platformCoreFlags.platformCoreSchedulerV1 ?
      prisma.platformCoreDecisionSchedule.count({ where: { nextRunAt: { lt: new Date() } } })
    : Promise.resolve(0),
  ]);

  const warnings: string[] = [];
  if (failedTasks >= FAILED_TASK_WARN_THRESHOLD) {
    warnings.push(`Elevated failed internal tasks (${failedTasks}) — review queue and logs.`);
  }
  if (blockedDecisions >= BLOCKED_WARN_THRESHOLD) {
    warnings.push(`Large blocked decision backlog (${blockedDecisions}) — policy or guardrail review.`);
  }
  if (staleQueued > 0) {
    warnings.push(`${staleQueued} queued task(s) older than 24h — consider cancel or retry.`);
  }
  if (conflictAudit24h >= CONFLICT_AUDIT_WARN_THRESHOLD) {
    warnings.push(
      `High cross-decision conflict signal (${conflictAudit24h} conflict audit events in 24h) — review overlapping recommendations.`,
    );
  }
  if (stalePendingDecisions >= STALE_PENDING_DECISIONS_WARN_THRESHOLD) {
    warnings.push(
      `Many stale pending decisions (${stalePendingDecisions} older than 48h) — review queue throughput.`,
    );
  }
  if (blockedDependencyEdges >= BLOCKED_DEPS_WARN_THRESHOLD) {
    warnings.push(
      `Large BLOCKS dependency graph (${blockedDependencyEdges} edges) — check for gridlock between decisions.`,
    );
  }
  const execTotal = executedDecisions + failedDecisions;
  if (execTotal >= EXEC_SUCCESS_MIN_TOTAL && executedDecisions / execTotal < EXEC_SUCCESS_RATIO_WARN) {
    warnings.push(
      `Low internal execution success rate (${executedDecisions}/${execTotal} executed) — inspect failures before scaling automation.`,
    );
  }
  if (overdueSchedules > 0) {
    warnings.push(
      `${overdueSchedules} decision re-evaluation schedule(s) are past due — run scheduled evaluations or review stuck rows.`,
    );
  }

  return {
    pendingDecisions,
    blockedDecisions,
    failedTasks,
    runningTasks,
    queuedTasks,
    recentAuditCount,
    warnings,
  };
}
