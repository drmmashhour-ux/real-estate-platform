import { prisma } from "@/lib/db";
import {
  computeListingScore,
  normalizeEngagement,
  esgScoreFromListing,
  type ListingScoreInput,
} from "@/modules/listing-ranking/listing-score.engine";

function completenessFromListing(row: {
  images: unknown[];
  description: string;
  sellerDeclarationCompletedAt: Date | null;
  bedrooms: number | null;
  bathrooms: number | null;
}): number {
  let s = 25;
  if (row.images.length >= 6) s += 25;
  else if (row.images.length >= 3) s += 15;
  else if (row.images.length >= 1) s += 8;
  const descLen = row.description.trim().length;
  if (descLen > 600) s += 20;
  else if (descLen > 200) s += 12;
  else if (descLen > 40) s += 6;
  if (row.sellerDeclarationCompletedAt) s += 18;
  if (row.bedrooms != null && row.bathrooms != null) s += 12;
  return Math.min(100, s);
}

/** Loads FSBO analytics + metrics and returns the LECIPM listing score envelope. */
export async function loadFsboListingScore(listingId: string) {
  const listing = await prisma.fsboListing.findUnique({
    where: { id: listingId },
    select: {
      images: true,
      description: true,
      sellerDeclarationCompletedAt: true,
      bedrooms: true,
      bathrooms: true,
      trustScore: true,
      moderationStatus: true,
      verification: { select: { identityStatus: true } },
      lecipmGreenProgramTier: true,
      lecipmGreenInternalScore: true,
      featuredUntil: true,
      status: true,
    },
  });
  if (!listing) return null;

  const [metrics, views, leads] = await Promise.all([
    prisma.fsboListingMetrics.findUnique({ where: { fsboListingId: listingId } }),
    prisma.buyerListingView.count({ where: { fsboListingId: listingId } }),
    prisma.fsboLead.count({ where: { listingId } }),
  ]);

  const verified =
    listing.moderationStatus === "APPROVED" && listing.verification?.identityStatus === "VERIFIED";

  const featured =
    listing.featuredUntil != null && new Date(listing.featuredUntil).getTime() > Date.now();

  const engagement = normalizeEngagement(views, leads);

  const input: ListingScoreInput = {
    esgScore: esgScoreFromListing(listing.lecipmGreenProgramTier, listing.lecipmGreenInternalScore),
    priceCompetitiveness: metrics?.priceCompetitivenessScore != null
      ? Math.round(Math.min(100, Math.max(0, metrics.priceCompetitivenessScore)))
      : 55,
    engagementScore: metrics?.engagementScore != null
      ? Math.round(Math.min(100, Math.max(0, metrics.engagementScore)))
      : engagement,
    completeness: completenessFromListing(listing),
    aiOptimizationScore:
      listing.trustScore != null ? Math.min(100, Math.max(0, listing.trustScore)) : 50,
    verified,
    featured,
  };

  const result = computeListingScore(input);
  return { input, result, views, leads };
}
