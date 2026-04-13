import { prisma } from "@/lib/db";
import { computeListingQualityFull } from "@/lib/quality/compute-quality-score";
import { generateHealthActionsForListing } from "@/lib/quality/generate-health-actions";

export async function updateListingQuality(listingId: string): Promise<void> {
  const exists = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    select: { id: true },
  });
  if (!exists) return;

  const computed = await computeListingQualityFull(listingId);
  const actions = await generateHealthActionsForListing(listingId);

  await prisma.$transaction(async (tx) => {
    await tx.listingQualityScore.upsert({
      where: { listingId },
      create: {
        listingId,
        qualityScore: computed.qualityScore,
        level: computed.level,
        contentScore: computed.contentScore,
        pricingScore: computed.pricingScore,
        performanceScore: computed.performanceScore,
        behaviorScore: computed.behaviorScore,
        trustScore: computed.trustScore,
        healthStatus: computed.healthStatus,
        reasonsJson: computed.reasonsJson as object,
      },
      update: {
        qualityScore: computed.qualityScore,
        level: computed.level,
        contentScore: computed.contentScore,
        pricingScore: computed.pricingScore,
        performanceScore: computed.performanceScore,
        behaviorScore: computed.behaviorScore,
        trustScore: computed.trustScore,
        healthStatus: computed.healthStatus,
        reasonsJson: computed.reasonsJson as object,
      },
    });

    await tx.listingHealthAction.deleteMany({
      where: { listingId, resolved: false },
    });

    if (actions.length > 0) {
      await tx.listingHealthAction.createMany({
        data: actions.map((a) => ({
          listingId,
          type: a.type,
          priority: a.priority,
          title: a.title,
          description: a.description,
          resolved: false,
        })),
      });
    }
  });
}
