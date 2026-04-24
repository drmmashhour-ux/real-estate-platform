import { RolloutExecutionStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { logRolloutTagged } from "@/lib/server/launch-logger";
import { evaluateRollout } from "./rollout-evaluator.service";
import { persistRolloutMetricSnapshot } from "./rollout-metrics.service";
import {
  increaseRolloutPercent,
  pauseRolloutExecution,
  rollbackRolloutExecution,
} from "./rollout-policy.service";

/**
 * Single evaluation tick: snapshot → compare → auto increase / pause / rollback.
 */
export async function runRolloutAutoStep(executionId: string): Promise<void> {
  const ex = await prisma.rolloutExecution.findUnique({ where: { id: executionId } });
  if (!ex || ex.status !== RolloutExecutionStatus.RUNNING) return;

  await persistRolloutMetricSnapshot(executionId);
  const ev = await evaluateRollout(executionId);

  await prisma.rolloutExecution.update({
    where: { id: executionId },
    data: { lastEvaluatedAt: new Date() },
  });

  if (ev.verdict === "DEGRADE") {
    await rollbackRolloutExecution(
      executionId,
      `auto_degrade composite ~${ev.degradationPct.toFixed(2)}% vs baseline window`,
    );
    return;
  }

  if (ev.verdict === "IMPROVE") {
    await increaseRolloutPercent(
      executionId,
      `auto_improve ~${ev.improvementPct.toFixed(2)}% vs baseline window`,
    );
    return;
  }

}

export async function runRolloutAutoForAllRunning(): Promise<{ processed: number; errors: number }> {
  const running = await prisma.rolloutExecution.findMany({
    where: { status: RolloutExecutionStatus.RUNNING },
    select: { id: true },
  });

  let processed = 0;
  let errors = 0;

  for (const row of running) {
    try {
      await runRolloutAutoStep(row.id);
      processed += 1;
    } catch (e) {
      errors += 1;
      logRolloutTagged.error("rollout_auto_step_failed", {
        executionId: row.id,
        message: e instanceof Error ? e.message : String(e),
      });
    }
  }

  return { processed, errors };
}

/** Optional guard: pause if metrics collection fails repeatedly (manual resume). */
export async function pauseRolloutForSafety(executionId: string, reason: string): Promise<void> {
  await pauseRolloutExecution(executionId, reason);
}
