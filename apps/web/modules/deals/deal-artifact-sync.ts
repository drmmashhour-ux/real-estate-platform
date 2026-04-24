import { prisma } from "@/lib/db";
import { logInfo } from "@/lib/logger";

const TAG = "[deal-pipeline]";

/** When memo / IC pack regenerates for a CRM listing, wire latest artifact ids to pipeline deals sharing that listing. */
export async function syncArtifactsForListing(
  listingId: string,
  opts: { memoId?: string; icPackId?: string }
): Promise<void> {
  if (!opts.memoId && !opts.icPackId) return;

  const deals = await prisma.investmentPipelineDeal.findMany({
    where: { listingId },
    select: { id: true },
  });

  if (deals.length === 0) return;

  const data: { latestMemoId?: string; latestIcPackId?: string } = {};
  if (opts.memoId) data.latestMemoId = opts.memoId;
  if (opts.icPackId) data.latestIcPackId = opts.icPackId;

  await prisma.investmentPipelineDeal.updateMany({
    where: { listingId },
    data,
  });

  for (const d of deals) {
    await prisma.investmentPipelineDecisionAudit.create({
      data: {
        dealId: d.id,
        eventType: "ARTIFACTS_REFRESHED",
        note: `Memo / IC artifact pointers updated (${opts.memoId ? "memo " : ""}${opts.icPackId ? "IC pack " : ""})`,
        metadataJson: { memoId: opts.memoId ?? null, icPackId: opts.icPackId ?? null },
      },
    });
    import("@/modules/deals/deal-workflow-orchestrator")
      .then((m) => m.reconcileAfterArtifactsUpdate(d.id, null))
      .catch(() => {});

    import("@/modules/investment-ai/deal-underwriting.integration.service")
      .then((m) => m.runAndAttachUnderwritingToDeal(d.id, { source: "ARTIFACTS_REFRESH" }))
      .catch(() => {});
  }

  logInfo(`${TAG}`, { listingId, dealCount: deals.length, ...opts });
}
