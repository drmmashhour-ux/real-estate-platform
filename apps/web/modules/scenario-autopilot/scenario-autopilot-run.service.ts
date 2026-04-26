import type { PlatformRole } from "@prisma/client";

import { runWhatIfSimulation } from "@/modules/simulation/simulation.engine";
import { loadSimulationBaseline } from "@/modules/simulation/simulation-baseline.service";
import type { WhatIfResult } from "@/modules/simulation/simulation.types";

import { generateCandidateScenarios } from "./scenario-generator.service";
import { rankEnrichedCandidates } from "./scenario-ranking.service";
import { normalizeSimulationOutput } from "./scenario-simulation-adapter";
import {
  buildApprovalExplanation,
  buildSuccessMetricPreview,
  buildWhyApprovalRequired,
} from "./scenario-explainability.service";
import type { ApprovalPayload, EnrichedCandidate, RankingResult } from "./scenario-autopilot.types";
import { scenarioAutopilotLog } from "./scenario-autopilot-log";

import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();

function enrich(
  raw: ReturnType<typeof generateCandidateScenarios>,
  baseline: Awaited<ReturnType<typeof loadSimulationBaseline>>,
): EnrichedCandidate[] {
  return raw.map((c) => {
    const simulation: WhatIfResult = runWhatIfSimulation(baseline, c.parameters);
    const normalized = normalizeSimulationOutput(simulation);
    return { ...c, simulation, normalized };
  });
}

function buildPayload(ranking: RankingResult): ApprovalPayload {
  const best = ranking.best;
  return {
    scenarioSummary: `${best.title} (${best.domain})`,
    predictedImpact: best.normalized,
    riskWarnings: best.simulation.riskWarnings,
    explanation: buildApprovalExplanation(best, ranking),
    rollbackAvailable: best.reversible,
    affectedDomains: [best.domain],
    bestCandidate: best,
  };
}

export async function createScenarioAutopilotRun(userId: string, role: PlatformRole) {
  const baseline = await loadSimulationBaseline(userId, role, null);
  const raw = generateCandidateScenarios();
  const enriched = enrich(raw, baseline);
  const ranking = rankEnrichedCandidates(enriched);
  const payload = buildPayload(ranking);

  const run = await prisma.lecipmScenarioAutopilotRun.create({
    data: {
      userId,
      status: "READY_FOR_REVIEW",
      candidatesJson: JSON.parse(JSON.stringify(enriched)) as object,
      rankingJson: JSON.parse(JSON.stringify(ranking)) as object,
      bestCandidateId: ranking.best.id,
      rankingRationale: ranking.reasonBestWon,
      approvalPayload: JSON.parse(JSON.stringify(payload)) as object,
      baselineAtGeneration: JSON.parse(JSON.stringify(baseline)) as object,
    },
  });

  scenarioAutopilotLog.line("scenario", "batch_created", { runId: run.id, n: enriched.length });
  scenarioAutopilotLog.line("simulation", "candidates_evaluated", { runId: run.id, best: ranking.best.id });
  for (const w of ranking.best.simulation.riskWarnings) {
    scenarioAutopilotLog.line("simulation", w, { runId: run.id });
  }

  return {
    id: run.id,
    status: run.status,
    ranking,
    approvalPayload: payload,
    whyApproval: buildWhyApprovalRequired(ranking.best),
    successPreview: buildSuccessMetricPreview(ranking.best),
    run,
  };
}

export async function getRun(runId: string) {
  return prisma.lecipmScenarioAutopilotRun.findFirst({ where: { id: runId } });
}

export async function listRuns(userId: string, take = 20) {
  return prisma.lecipmScenarioAutopilotRun.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take,
  });
}

export async function getAutopilotSummary(userId: string) {
  const [pending, recent, bestWeek] = await Promise.all([
    prisma.lecipmScenarioAutopilotRun.findMany({
      where: { userId, status: { in: ["READY_FOR_REVIEW", "GENERATED", "APPROVED"] } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.lecipmScenarioAutopilotRun.findMany({
      where: { userId, status: "EXECUTED" },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
    prisma.lecipmScenarioAutopilotRun.findFirst({
      where: {
        userId,
        status: "EXECUTED",
        updatedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const failed = await prisma.lecipmScenarioAutopilotRun.findMany({
    where: { userId, status: "FAILED" },
    take: 3,
  });

  return {
    pendingApprovals: pending,
    recentExecuted: recent,
    failed,
    bestThisWeek: bestWeek,
    generatedAt: new Date().toISOString(),
  };
}
