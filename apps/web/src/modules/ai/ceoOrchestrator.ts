import { randomUUID } from "crypto";
import { analyzeMetrics, generateActions, type CeoAction } from "@/src/modules/ai/decisionEngine";
import { runOpsMonitorChecks } from "@/src/modules/ai/opsMonitor";
import { detectBestChannels, recommendScalingActions } from "@/src/modules/ai/growthDirector";

export type CeoDailyExecution = { actionId?: string; type: string; ok: boolean; detail?: string };

/**
 * Single cron entrypoint: metrics → ops → scaling hints → planned actions → simulated execution log.
 * Persisted `ai_ceo_daily_runs` can be added when the Prisma model lands.
 */
export async function runAiCeoDailyCycle(): Promise<{
  runId: string;
  actions: CeoAction[];
  execution: CeoDailyExecution[];
  opsIssues: Awaited<ReturnType<typeof runOpsMonitorChecks>>;
}> {
  const metrics = await analyzeMetrics();
  const opsIssues = await runOpsMonitorChecks(metrics);
  const channelStats = await detectBestChannels(30, 8);
  const scalingHints = recommendScalingActions(channelStats);
  const actions = generateActions(metrics, { opsIssues, scalingHints });
  const execution: CeoDailyExecution[] = actions.map((a) => ({
    actionId: a.id,
    type: a.type,
    ok: true,
    detail: "Recorded — wire actionExecutor for side effects",
  }));
  return { runId: randomUUID(), actions, execution, opsIssues };
}
