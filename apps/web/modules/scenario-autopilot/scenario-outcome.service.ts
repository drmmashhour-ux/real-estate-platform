import { loadSimulationBaseline } from "@/modules/simulation/simulation-baseline.service";
import type { PlatformRole } from "@prisma/client";

import type { OutcomeRecord } from "./scenario-autopilot.types";
import { scenarioAutopilotLog } from "./scenario-autopilot-log";

import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();

import { recordOutcome } from "@/modules/outcomes/outcome.service";

/**
 * Compares post-execution metrics to baseline snapshot (read-only queries only).
 */
export async function measureOutcomeForRun(
  runId: string,
  userId: string,
  role: PlatformRole,
): Promise<OutcomeRecord | { error: string }> {
  const run = await prisma.lecipmScenarioAutopilotRun.findFirst({ where: { id: runId } });
  if (!run) return { error: "not_found" };
  if (run.userId !== userId) return { error: "forbidden" };
  if (run.status !== "EXECUTED") {
    return { error: "not_eligible" };
  }

  const before = run.baselineAtGeneration as unknown;
  if (!before || typeof before !== "object") {
    return { error: "no_baseline" };
  }

  const after = await loadSimulationBaseline(userId, role, null);
  const b = before as import("@/modules/simulation/simulation.types").SimulationBaseline;

  const windowDays = 7;
  const delta = {
    leads: after.leads30d - b.leads30d,
    conversionPct: after.conversionPct - b.conversionPct,
    revenueProxyPct:
      b.pipelineValueCents > 0 ?
        ((after.pipelineValueCents - b.pipelineValueCents) / b.pipelineValueCents) * 100
      : 0,
    disputeCount: after.openDisputes - b.openDisputes,
    trust:
      after.trustScore != null && b.trustScore != null ? after.trustScore - b.trustScore : null,
  };

  const match: OutcomeRecord["didItMatchPrediction"] =
    Math.abs(delta.conversionPct) < 2 && Math.abs(delta.revenueProxyPct) < 8 ? "partial" : "unknown";

  const record: OutcomeRecord = {
    windowDays,
    baselineBefore: b,
    resultAfter: after,
    delta,
    didItMatchPrediction: match,
    confidence: "medium",
    measuredAt: new Date().toISOString(),
  };

  await prisma.lecipmScenarioAutopilotRun.update({
    where: { id: runId },
    data: { outcomeJson: record as object },
  });
  const predictedOutcome = {
    bestCandidateId: run.bestCandidateId,
    baselineSnapshot: Boolean(run.baselineAtGeneration),
  };
  const comparisonLabel =
    record.didItMatchPrediction === "yes" ? ("match" as const)
    : record.didItMatchPrediction === "partial" ? ("partial" as const)
    : record.didItMatchPrediction === "no" ? ("miss" as const)
    : ("unknown" as const);
  void recordOutcome({
    entityType: "scenario",
    entityId: runId,
    actionTaken: "scenario_measured",
    source: "scenario_autopilot",
    predictedOutcome: predictedOutcome as object,
    actualOutcome: { didItMatchPrediction: record.didItMatchPrediction, windowDays: record.windowDays },
    delta: record.delta as object,
    contextUserId: userId,
    comparisonLabel,
  }).then((r) => {
    if (!r.ok) console.error("[lecipm][outcome] scenario record failed", r);
  });
  scenarioAutopilotLog.line("outcome", "recorded", { runId });
  return record;
}

export async function listRecentOutcomes(userId: string, take = 10) {
  const rows = await prisma.lecipmScenarioAutopilotRun.findMany({
    where: { userId, outcomeJson: { not: null } },
    orderBy: { updatedAt: "desc" },
    take,
    select: { id: true, outcomeJson: true, bestCandidateId: true, status: true, updatedAt: true },
  });
  return rows;
}
