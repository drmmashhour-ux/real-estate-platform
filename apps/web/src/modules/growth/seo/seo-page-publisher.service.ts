import { prisma } from "@/lib/db";
import { engineFlags } from "@/config/feature-flags";

/**
 * Publishing is review-first. Logs every action; optional trusted auto-publish behind flag.
 */
export async function publishSeoPageAfterReview(params: {
  seoPageOpportunityId: string;
  actorUserId: string;
}): Promise<{ ok: boolean; reason?: string }> {
  const draft = await prisma.seoPageDraft.findUnique({
    where: { seoPageOpportunityId: params.seoPageOpportunityId },
  });
  if (!draft) return { ok: false, reason: "no_draft" };
  if (draft.publishStatus === "published") return { ok: false, reason: "already_published" };

  if (!engineFlags.seoAutoPublishTrusted) {
    await prisma.seoPagePublishLog.create({
      data: {
        seoPageOpportunityId: params.seoPageOpportunityId,
        action: "publish_blocked_flag_off",
        actorUserId: params.actorUserId,
        detailJson: { note: "FEATURE_SEO_AUTO_PUBLISH_TRUSTED off — use CMS route manually." },
      },
    });
    return { ok: false, reason: "flag_off" };
  }

  await prisma.$transaction([
    prisma.seoPageDraft.update({
      where: { id: draft.id },
      data: { publishStatus: "published", publishedAt: new Date(), draftStatus: "approved" },
    }),
    prisma.seoPageOpportunity.update({
      where: { id: params.seoPageOpportunityId },
      data: { status: "published" },
    }),
    prisma.seoPagePublishLog.create({
      data: {
        seoPageOpportunityId: params.seoPageOpportunityId,
        action: "published",
        actorUserId: params.actorUserId,
        detailJson: { trustedAutoPublish: true },
      },
    }),
  ]);

  return { ok: true };
}
