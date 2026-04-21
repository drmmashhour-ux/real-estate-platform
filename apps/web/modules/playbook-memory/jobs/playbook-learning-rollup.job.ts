import { prisma } from "@/lib/db";
import * as repo from "../repository/playbook-memory.repository";
import { recalculatePlaybookStats } from "../services/playbook-memory-learning.service";
import { playbookLog } from "../playbook-memory.logger";

/** Recompute aggregates for every memory playbook (bounded batch). */
export async function runPlaybookLearningRollup(params?: { maxPlaybooks?: number }) {
  const max = params?.maxPlaybooks ?? 200;
  const ids = await prisma.memoryPlaybook.findMany({
    select: { id: true },
    take: max,
    orderBy: { updatedAt: "desc" },
  });

  let updated = 0;
  for (const row of ids) {
    try {
      await recalculatePlaybookStats(row.id);
      updated += 1;
    } catch (e) {
      playbookLog.error("rollup failed", {
        playbookId: row.id,
        message: e instanceof Error ? e.message : String(e),
      });
    }
  }

  playbookLog.info("runPlaybookLearningRollup", { updated });
  return { updated };
}
