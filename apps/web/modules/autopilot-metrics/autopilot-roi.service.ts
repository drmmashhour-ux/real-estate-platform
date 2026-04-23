import { prisma } from "@/lib/db";

/**
 * Best-effort ROI / uplift from stored outcome linkages (advisory, not GAAP).
 */
export async function getAutopilotOutcomeRoiSnapshot(since: Date) {
  const rows = await prisma.lecipmFullAutopilotExecution.findMany({
    where: {
      createdAt: { gte: since },
      outcomeDeltaJson: { not: null },
    },
    take: 500,
    orderBy: { createdAt: "desc" },
    select: {
      domain: true,
      outcomeDeltaJson: true,
      outcomeConfidence: true,
      outcomeWindow: true,
    },
  });

  return {
    linkedRows: rows.length,
    note:
      rows.length === 0 ?
        "No outcome deltas recorded yet — wire domain workers to persist outcomeDeltaJson post-execution."
      : "Review linkedRows for uplift signals; reconcile with finance for revenue claims.",
  };
}
