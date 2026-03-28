import { prisma } from "@/lib/db";
import { isExecutiveAutoActionsEnabled, isExecutiveControlEnabled } from "@/src/modules/executive/executiveEnv";
import { buildExecutiveKpiSnapshot, saveExecutiveKpiSnapshot } from "@/src/modules/executive/kpiEngine";
import { runAllEntityScoring } from "@/src/modules/executive/scoringEngine";
import { detectAllBottlenecks } from "@/src/modules/executive/bottleneckEngine";
import { generateExecutiveRecommendations, saveExecutiveRecommendations } from "@/src/modules/executive/recommendationEngine";
import { isAiRankingEngineEnabled } from "@/src/modules/ranking/rankingEnv";
import { buildRankingExecutiveRecommendations } from "@/src/modules/ranking/rankingExecutiveBridge";
import { buildFraudExecutiveRecommendations } from "@/src/modules/fraud/fraudExecutiveBridge";
import { executeSafeExecutiveAction } from "@/src/modules/executive/autoActionEngine";
import { notifyAdminOfCriticalRecommendation } from "@/src/modules/executive/notificationHooks";

export type ExecutiveCycleMode = "daily" | "weekly";

const MUTATING_ACTIONS = new Set([
  "lower_broker_assignment_priority",
  "raise_broker_assignment_priority",
  "lower_host_assignment_priority",
  "raise_host_assignment_priority",
  "enable_low_risk_experiment",
]);

export async function processExecutiveControlCycle(mode: ExecutiveCycleMode): Promise<{
  snapshotsCreated: number;
  scoresUpdated: number;
  bottlenecksFound: number;
  recommendationsCreated: number;
  actionsExecuted: number;
  skipped?: string;
}> {
  if (!isExecutiveControlEnabled()) {
    return {
      snapshotsCreated: 0,
      scoresUpdated: 0,
      bottlenecksFound: 0,
      recommendationsCreated: 0,
      actionsExecuted: 0,
      skipped: "AI_EXECUTIVE_CONTROL_ENABLED not 1",
    };
  }

  const now = new Date();
  const snap = await buildExecutiveKpiSnapshot(mode, now);
  await saveExecutiveKpiSnapshot(snap);
  const snapshotsCreated = 1;

  const scores = await runAllEntityScoring();
  const scoresUpdated =
    scores.cities + scores.listings + scores.brokers + scores.hosts + scores.routes + scores.templates;

  const bottlenecks = await detectAllBottlenecks();
  const recInputs = await generateExecutiveRecommendations(bottlenecks);
  let recommendationsCreated = await saveExecutiveRecommendations(recInputs);
  if (isAiRankingEngineEnabled()) {
    const rankingRecs = await buildRankingExecutiveRecommendations();
    recommendationsCreated += await saveExecutiveRecommendations(rankingRecs);
  }
  const fraudRecs = await buildFraudExecutiveRecommendations();
  recommendationsCreated += await saveExecutiveRecommendations(fraudRecs);

  let actionsExecuted = 0;
  if (isExecutiveAutoActionsEnabled()) {
    const autoCandidates = await prisma.executiveRecommendation.findMany({
      where: {
        status: "open",
        safeAutoActionKey: { not: null },
        priorityScore: { gte: 85 },
      },
      take: 8,
      orderBy: { priorityScore: "desc" },
    });
    for (const rec of autoCandidates) {
      if (!rec.safeAutoActionKey || !MUTATING_ACTIONS.has(rec.safeAutoActionKey)) continue;
      const r = await executeSafeExecutiveAction(rec.id);
      if (r.ok) actionsExecuted++;
    }
  }

  const criticalOpen = await prisma.executiveRecommendation.findMany({
    where: { status: "open", priorityScore: { gte: 95 } },
    take: 5,
  });
  for (const c of criticalOpen) {
    const already = await prisma.executiveActionRun.findFirst({
      where: { recommendationId: c.id, actionKey: "executive_critical_recommendation" },
    });
    if (!already) {
      await notifyAdminOfCriticalRecommendation({
        recommendationId: c.id,
        title: c.title,
        priorityScore: c.priorityScore,
      });
    }
  }

  return {
    snapshotsCreated,
    scoresUpdated,
    bottlenecksFound: bottlenecks.length,
    recommendationsCreated,
    actionsExecuted,
  };
}
