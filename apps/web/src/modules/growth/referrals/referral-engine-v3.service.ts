import { growthV3Flags } from "@/config/feature-flags";
import { prisma } from "@/lib/db";

/**
 * Creates high-trust referral *candidates* from recent positive signals — no messages sent here.
 */
export async function scanReferralEngagementTriggers(sinceDays = 7): Promise<{ inserted: number }> {
  if (!growthV3Flags.referralEngineV3) return { inserted: 0 };

  const since = new Date(Date.now() - sinceDays * 86400000);
  const events = await prisma.growthSignalEvent.findMany({
    where: {
      eventName: { in: ["booking_complete", "campaign_convert"] },
      createdAt: { gte: since },
    },
    select: { id: true, userId: true, eventName: true, payloadJson: true },
    take: 80,
  });

  let inserted = 0;
  for (const e of events) {
    if (!e.userId) continue;
    const dup = await prisma.growthOpportunityCandidate.findFirst({
      where: {
        type: "referral_engagement_v3",
        targetType: "user",
        targetId: e.userId,
        createdAt: { gte: since },
      },
    });
    if (dup) continue;

    await prisma.growthOpportunityCandidate.create({
      data: {
        type: "referral_engagement_v3",
        targetType: "user",
        targetId: e.userId,
        score: e.eventName === "booking_complete" ? 80 : 65,
        reason: `Observed ${e.eventName} — candidate for referral/UGC prompt after manual review.`,
        metadataJson: { signalEventId: e.id, grounded: true },
      },
    });
    inserted += 1;
  }

  return { inserted };
}
