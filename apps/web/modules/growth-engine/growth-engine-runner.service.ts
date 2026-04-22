import { randomUUID } from "crypto";

import { detectGrowthSignals } from "./growth-signal.service";
import { mapSignalsToActions } from "./growth-action.service";
import { executeProposedAction } from "./growth-execution.service";
import { getGrowthAutonomyMode } from "./growth-autonomy.service";
import type { GrowthEngineCycleResult } from "./growth-engine.types";

export async function runGrowthEngineCycle(options?: { dryRun?: boolean }): Promise<GrowthEngineCycleResult> {
  const dryRun = options?.dryRun ?? false;
  const runBatchId = randomUUID();
  const autonomyMode = getGrowthAutonomyMode();
  const errors: string[] = [];

  let autoExecuted = 0;
  let queuedApprovals = 0;
  let skipped = 0;

  try {
    const signals = await detectGrowthSignals();
    const actions = mapSignalsToActions(signals).slice(0, 45);

    for (const action of actions) {
      const r = await executeProposedAction(action, runBatchId, autonomyMode, dryRun);
      if (r.status === "auto_executed") autoExecuted += 1;
      else if (r.status === "queued_approval") queuedApprovals += 1;
      else skipped += 1;
      if (r.error) errors.push(r.error);
    }

    return {
      runBatchId,
      autonomyMode,
      signalsDetected: signals.length,
      actionsGenerated: actions.length,
      autoExecuted,
      queuedApprovals,
      skipped,
      errors,
    };
  } catch (e: unknown) {
    errors.push(e instanceof Error ? e.message : "runner_failed");
    return {
      runBatchId,
      autonomyMode,
      signalsDetected: 0,
      actionsGenerated: 0,
      autoExecuted,
      queuedApprovals,
      skipped,
      errors,
    };
  }
}
