import * as repo from "../repository/playbook-memory.repository";
import { evaluateMemoryRecordOutcome } from "../services/playbook-memory-outcome-evaluator.service";
import { playbookLog } from "../playbook-memory.logger";

/** Evaluate pending outcomes older than `delayMs` (default 24h lookback anchor). */
export async function runPlaybookOutcomeBackfill(params?: { delayMs?: number; batchSize?: number }) {
  const delayMs = params?.delayMs ?? 86_400_000;
  const batchSize = params?.batchSize ?? 50;
  const cutoff = new Date(Date.now() - delayMs);

  const pending = await repo.pendingOutcomeRecords({ olderThan: cutoff, take: batchSize });
  let processed = 0;
  for (const row of pending) {
    try {
      await evaluateMemoryRecordOutcome(row.id);
      processed += 1;
    } catch (e) {
      playbookLog.error("backfill outcome failed", {
        id: row.id,
        message: e instanceof Error ? e.message : String(e),
      });
    }
  }

  playbookLog.info("runPlaybookOutcomeBackfill complete", {
    scanned: pending.length,
    processed,
  });
  return { scanned: pending.length, processed };
}
