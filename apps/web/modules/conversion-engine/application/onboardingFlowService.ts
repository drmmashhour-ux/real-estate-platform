import type { PrismaClient } from "@prisma/client";

const SAMPLE_PROPERTY = "123 Main St, Montreal, QC";

export async function resolveOnboardingProperty(db: PrismaClient, userId: string) {
  const [listing, recentAnalysisLead] = await Promise.all([
    db.fsboListing.findFirst({
      where: { ownerId: userId },
      orderBy: { updatedAt: "desc" },
      select: { address: true, city: true },
    }),
    db.lead.findFirst({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      select: { source: true, purchaseRegion: true },
    }),
  ]);

  if (listing?.address) {
    return { propertyInput: `${listing.address}, ${listing.city}`, source: "user_listing" as const };
  }
  if (recentAnalysisLead?.source && /https?:\/\//i.test(recentAnalysisLead.source)) {
    return { propertyInput: recentAnalysisLead.source, source: "recent_activity" as const };
  }
  return { propertyInput: SAMPLE_PROPERTY, source: "sample" as const };
}
