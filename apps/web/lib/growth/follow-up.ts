import type { GrowthEngineLeadStage, PrismaClient } from "@prisma/client";

const HOURS_CONTACTED = 48;
const HOURS_INTERESTED_ASSETS = 72;

/**
 * Flags leads that need operator follow-up (no external auto-messages).
 */
export async function recomputeGrowthFollowUpFlags(prisma: PrismaClient): Promise<{ updated: number }> {
  const now = Date.now();
  const contactedCutoff = new Date(now - HOURS_CONTACTED * 60 * 60 * 1000);
  const assetsCutoff = new Date(now - HOURS_INTERESTED_ASSETS * 60 * 60 * 1000);

  const contactedStale = await prisma.growthEngineLead.findMany({
    where: {
      archivedAt: null,
      stage: "contacted" as GrowthEngineLeadStage,
      OR: [{ lastContactAt: null }, { lastContactAt: { lt: contactedCutoff } }],
    },
    select: { id: true },
  });

  const interestedStale = await prisma.growthEngineLead.findMany({
    where: {
      archivedAt: null,
      stage: "interested" as GrowthEngineLeadStage,
      OR: [{ lastContactAt: null }, { lastContactAt: { lt: assetsCutoff } }],
    },
    select: { id: true },
  });

  const ids = [...new Set([...contactedStale.map((x) => x.id), ...interestedStale.map((x) => x.id)])];
  if (ids.length === 0) return { updated: 0 };

  await prisma.growthEngineLead.updateMany({
    where: { id: { in: ids } },
    data: {
      needsFollowUp: true,
      followUpReason: "Stale stage — review and send a manual follow-up",
    },
  });

  return { updated: ids.length };
}
