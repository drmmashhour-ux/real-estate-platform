import { playbookLog } from "../playbook-memory.logger";
import { recalculateAllPlaybookStats } from "../services/playbook-memory-learning.service";

/** @deprecated use `recalculateAllPlaybookStats` from learning service; kept for import compatibility. */
export async function runPlaybookLearningRollup(params?: { maxPlaybooks?: number }) {
  const result = await recalculateAllPlaybookStats();
  if (params?.maxPlaybooks != null && result.processed > (params.maxPlaybooks ?? 200)) {
    playbookLog.info("runPlaybookLearningRollup: maxPlaybooks cap ignored; full list processed", { max: params.maxPlaybooks });
  }
  playbookLog.info("runPlaybookLearningRollup", { processed: result.processed, failed: result.failed });
  return { updated: result.processed - result.failed, processed: result.processed, failed: result.failed };
}
