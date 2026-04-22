import { prisma } from "@/lib/db";

/**
 * Undo a safe auto-execution using `reversibleJson` from `LecipmGrowthEngineActionLog`.
 * Price / billing rows are never touched here.
 */
export async function revertGrowthEngineActionLog(logId: string): Promise<{ ok: boolean; message: string }> {
  const log = await prisma.lecipmGrowthEngineActionLog.findUnique({ where: { id: logId } });
  if (!log?.reversibleJson || log.revertedAt) {
    return { ok: false, message: "Nothing to revert or already reverted." };
  }

  const rev = log.reversibleJson as Record<string, unknown>;

  try {
    if (typeof rev.prevFeaturedBoost === "number" && log.entityKind === "fsbo_listing" && log.entityId) {
      await prisma.fsboListing.update({
        where: { id: log.entityId },
        data: { featuredBoostScore: rev.prevFeaturedBoost },
      });
    }
    if (typeof rev.prevDemandScore === "number" && log.entityId && (log.entityKind === "fsbo_listing" || log.entityKind === "crm_listing")) {
      const kind = log.entityKind === "fsbo_listing" ? "FSBO" : "CRM";
      await prisma.listingAnalytics.updateMany({
        where: { kind, listingId: log.entityId },
        data: { demandScore: rev.prevDemandScore as number },
      });
    }
    if (
      rev.prevAiDiscoveryScore !== undefined &&
      rev.prevAiDiscoveryScore !== null &&
      log.entityKind === "bnhub_listing" &&
      log.entityId
    ) {
      await prisma.shortTermListing.update({
        where: { id: log.entityId },
        data: { aiDiscoveryScore: rev.prevAiDiscoveryScore === null ? null : (rev.prevAiDiscoveryScore as number) },
      });
    }
    if (Array.isArray(rev.prevTags) && log.entityKind === "fsbo_listing" && log.entityId) {
      await prisma.fsboListing.update({
        where: { id: log.entityId },
        data: { experienceTags: rev.prevTags as string[] },
      });
    }

    await prisma.lecipmGrowthEngineActionLog.update({
      where: { id: logId },
      data: { revertedAt: new Date() },
    });

    return { ok: true, message: "Reverted using stored snapshot." };
  } catch (e: unknown) {
    return { ok: false, message: e instanceof Error ? e.message : "revert_failed" };
  }
}
