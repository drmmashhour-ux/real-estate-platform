import type { PrismaClient } from "@prisma/client";
import { buildListingInsight } from "../infrastructure/listingAnalysisAI";

export async function analyzeListingWithAiCore(db: PrismaClient, listingId: string) {
  const listing = await db.fsboListing.findUnique({
    where: { id: listingId },
    select: { id: true, trustScore: true, moderationStatus: true, status: true },
  });
  if (!listing) return null;

  const lead = await db.lead.findFirst({
    where: { fsboListingId: listingId },
    orderBy: { createdAt: "desc" },
    select: { lecipmDealQualityScore: true },
  });

  const issues: string[] = [];
  if (listing.moderationStatus !== "APPROVED") issues.push("listing moderation not approved");
  if (listing.status !== "ACTIVE") issues.push("listing not active");

  return buildListingInsight({
    listingId: listing.id,
    trustScore: listing.trustScore,
    dealScore: lead?.lecipmDealQualityScore ?? null,
    issues,
  });
}
