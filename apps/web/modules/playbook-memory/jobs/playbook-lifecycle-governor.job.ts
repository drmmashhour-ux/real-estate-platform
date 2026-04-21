import { prisma } from "@/lib/db";
import { demoteIfUnderperforming, promoteVersionIfEligible } from "../services/playbook-memory-lifecycle.service";
import { playbookLog } from "../playbook-memory.logger";

export async function runPlaybookLifecycleGovernor(params?: { maxPlaybooks?: number }) {
  const max = params?.maxPlaybooks ?? 100;
  const rows = await prisma.memoryPlaybook.findMany({
    where: { status: "ACTIVE" },
    select: { id: true },
    take: max,
  });

  let promoted = 0;
  let demoted = 0;
  for (const r of rows) {
    try {
      if (await promoteVersionIfEligible(r.id)) promoted += 1;
      if (await demoteIfUnderperforming(r.id)) demoted += 1;
    } catch (e) {
      playbookLog.error("lifecycle governor row failed", {
        id: r.id,
        message: e instanceof Error ? e.message : String(e),
      });
    }
  }

  playbookLog.info("runPlaybookLifecycleGovernor", { promoted, demoted });
  return { promoted, demoted };
}
