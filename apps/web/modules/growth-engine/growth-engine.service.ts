import { prisma } from "@/lib/db";

import { detectGrowthSignals } from "./growth-signal.service";
import { listPendingGrowthApprovals, toApprovalRowVm } from "./growth-approval.service";
import { getGrowthPerformanceSummary } from "./growth-performance.service";
import { listTopLearningRows } from "./growth-learning.service";
import { getGrowthAutonomyMode } from "./growth-autonomy.service";
import { runGrowthEngineCycle } from "./growth-engine-runner.service";
import type { GrowthEngineDashboardVm, GrowthEngineCycleResult } from "./growth-engine.types";

async function buildLastRunSnapshot(mode: ReturnType<typeof getGrowthAutonomyMode>): Promise<GrowthEngineCycleResult | null> {
  const lastBatch = await prisma.lecipmGrowthEngineActionLog.findFirst({
    orderBy: { createdAt: "desc" },
    select: { runBatchId: true },
  });
  if (!lastBatch?.runBatchId) return null;
  const batchLogs = await prisma.lecipmGrowthEngineActionLog.findMany({
    where: { runBatchId: lastBatch.runBatchId },
  });
  return {
    runBatchId: lastBatch.runBatchId,
    autonomyMode: mode,
    signalsDetected: 0,
    actionsGenerated: batchLogs.length,
    autoExecuted: batchLogs.filter((l) => l.status === "auto_executed").length,
    queuedApprovals: batchLogs.filter((l) => l.status === "queued_approval").length,
    skipped: batchLogs.filter((l) => l.status === "skipped" || l.status === "assist_only").length,
    errors: [],
  };
}

export async function getGrowthEngineDashboardPayload(): Promise<GrowthEngineDashboardVm> {
  const mode = getGrowthAutonomyMode();
  const [signals, approvals, perf, learning, logs, lastRun] = await Promise.all([
    detectGrowthSignals(),
    listPendingGrowthApprovals(25),
    getGrowthPerformanceSummary(),
    listTopLearningRows(10),
    prisma.lecipmGrowthEngineActionLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 40,
    }),
    buildLastRunSnapshot(mode),
  ]);

  return {
    autonomyMode: mode,
    lastRun,
    activeSignals: signals.slice(0, 40),
    recentActions: logs.map((l) => ({
      id: l.id,
      runBatchId: l.runBatchId,
      signalCode: l.signalCode,
      actionCode: l.actionCode,
      entityKind: l.entityKind,
      entityId: l.entityId,
      autonomyMode: l.autonomyMode,
      riskTier: l.riskTier,
      status: l.status,
      explanation: l.explanation,
      createdAt: l.createdAt.toISOString(),
      revertedAt: l.revertedAt?.toISOString() ?? null,
    })),
    approvalQueue: approvals.map(toApprovalRowVm),
    performance: perf,
    learningTop: learning,
  };
}

export { runGrowthEngineCycle };
export * from "./growth-engine.types";
