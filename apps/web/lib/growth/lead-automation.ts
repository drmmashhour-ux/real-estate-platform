import { EarlyUserTrackingStatus, LeadPriorityTier } from "@prisma/client";
import { prisma } from "@/lib/db";
import { pickFollowUpHours, suggestFollowUpAt } from "@/services/growth/ai-outreach";

export function tierFromScore(score: number | null | undefined): LeadPriorityTier | null {
  if (score == null || Number.isNaN(score)) return null;
  if (score >= 70) return LeadPriorityTier.HIGH;
  if (score >= 40) return LeadPriorityTier.MEDIUM;
  return LeadPriorityTier.LOW;
}

export type AutomationResult = {
  followUpsScheduled: number;
  tiersSynced: number;
};

/**
 * Light rules: (1) CONTACTED leads with no follow-up due, first touched 36h+ ago → set followUpAt.
 * (2) Rows with conversionScore set → align leadTier if missing or stale (overwrite tier from score).
 */
export async function applyGrowthLeadAutomation(opts?: { dryRun?: boolean }): Promise<AutomationResult> {
  const cutoff = new Date(Date.now() - 36 * 60 * 60 * 1000);
  const stale = await prisma.earlyUserTracking.findMany({
    where: {
      status: EarlyUserTrackingStatus.CONTACTED,
      followUpAt: null,
      createdAt: { lte: cutoff },
    },
    take: 300,
    select: { id: true, createdAt: true, contact: true },
  });

  let followUpsScheduled = 0;
  if (!opts?.dryRun && stale.length) {
    await prisma.$transaction(
      stale.map((row) => {
        const hours = pickFollowUpHours(row.id + row.contact);
        const at = suggestFollowUpAt(row.createdAt, hours);
        return prisma.earlyUserTracking.update({
          where: { id: row.id },
          data: { followUpAt: at },
        });
      })
    );
    followUpsScheduled = stale.length;
  } else if (opts?.dryRun) {
    followUpsScheduled = stale.length;
  }

  const scored = await prisma.earlyUserTracking.findMany({
    where: { conversionScore: { not: null } },
    select: { id: true, conversionScore: true, leadTier: true },
    take: 500,
  });

  let tiersSynced = 0;
  for (const row of scored) {
    const next = tierFromScore(row.conversionScore);
    if (next && row.leadTier !== next) {
      tiersSynced++;
      if (!opts?.dryRun) {
        await prisma.earlyUserTracking.update({
          where: { id: row.id },
          data: { leadTier: next },
        });
      }
    }
  }

  return { followUpsScheduled, tiersSynced };
}
