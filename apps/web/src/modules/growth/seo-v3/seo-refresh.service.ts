import { growthV3Flags } from "@/config/feature-flags";
import { prisma } from "@/lib/db";

const STALE_EVAL_DAYS = 45;
const STALE_DRAFT_DAYS = 60;

/**
 * Queues refresh jobs for stale SEO opportunities / drafts — generation still respects publish policy.
 */
export async function queueStaleSeoRefreshJobs(limit = 50): Promise<{ queued: number }> {
  if (!growthV3Flags.seoAutopilotV3) return { queued: 0 };

  const evalCut = new Date(Date.now() - STALE_EVAL_DAYS * 86400000);
  const draftCut = new Date(Date.now() - STALE_DRAFT_DAYS * 86400000);

  const stale = await prisma.seoPageOpportunity.findMany({
    where: {
      OR: [{ lastEvaluatedAt: { lt: evalCut } }, { lastEvaluatedAt: null }],
    },
    select: { id: true },
    take: limit,
    orderBy: { updatedAt: "asc" },
  });

  let queued = 0;
  for (const o of stale) {
    const pending = await prisma.seoPageRefreshJob.findFirst({
      where: { seoPageOpportunityId: o.id, status: "queued", reason: "stale_evaluation" },
    });
    if (pending) continue;
    await prisma.seoPageRefreshJob.create({
      data: {
        seoPageOpportunityId: o.id,
        reason: "stale_evaluation",
        status: "queued",
        metadataJson: { evalCutoffDays: STALE_EVAL_DAYS },
      },
    });
    queued += 1;
  }

  const draftStale = await prisma.seoPageDraft.findMany({
    where: {
      OR: [{ lastGeneratedAt: { lt: draftCut } }, { lastGeneratedAt: null }],
    },
    select: { seoPageOpportunityId: true },
    take: limit,
  });

  for (const d of draftStale) {
    const pending = await prisma.seoPageRefreshJob.findFirst({
      where: { seoPageOpportunityId: d.seoPageOpportunityId, status: "queued", reason: "stale_draft" },
    });
    if (pending) continue;
    await prisma.seoPageRefreshJob.create({
      data: {
        seoPageOpportunityId: d.seoPageOpportunityId,
        reason: "stale_draft",
        status: "queued",
        metadataJson: { draftCutoffDays: STALE_DRAFT_DAYS },
      },
    });
    queued += 1;
  }

  return { queued };
}
