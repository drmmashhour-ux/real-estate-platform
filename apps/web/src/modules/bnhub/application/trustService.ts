import { VerificationStatus } from "@prisma/client";
import type { ListingTrustScore } from "@/src/modules/bnhub/domain/types";
import { getListingById } from "@/src/modules/bnhub/infrastructure/bnhubRepository";

export function scoreFromReviews(ratings: number[]): number {
  if (!ratings.length) return 40;
  const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
  return Math.max(0, Math.min(100, Math.round((avg / 5) * 100)));
}

export function completenessScore(input: {
  title?: string | null;
  description?: string | null;
  address?: string | null;
  photos?: unknown;
  amenities?: unknown;
  houseRules?: string | null;
}): number {
  const checks = [
    Boolean(input.title?.trim()),
    Boolean(input.description?.trim()),
    Boolean(input.address?.trim()),
    Array.isArray(input.photos) && input.photos.length > 0,
    Array.isArray(input.amenities) && input.amenities.length > 0,
    Boolean(input.houseRules?.trim()),
  ];
  const pass = checks.filter(Boolean).length;
  return Math.round((pass / checks.length) * 100);
}

export function verificationScore(status: VerificationStatus): number {
  if (status === VerificationStatus.VERIFIED) return 100;
  if (status === VerificationStatus.PENDING) return 45;
  return 0;
}

export async function generateListingTrustScore(listingId: string): Promise<ListingTrustScore> {
  const listing = await getListingById(listingId);
  if (!listing) {
    throw new Error("Listing not found");
  }
  const completeness = completenessScore({
    title: listing.title,
    description: listing.description,
    address: listing.address,
    photos: listing.photos as unknown[],
    amenities: listing.amenities as unknown[],
    houseRules: listing.houseRules,
  });
  const verification = verificationScore(listing.verificationStatus);
  const reviews = scoreFromReviews(listing.reviews.map((r) => r.propertyRating));
  const score = Math.round(completeness * 0.35 + verification * 0.4 + reviews * 0.25);
  const badge = score >= 75 ? "high" : score >= 50 ? "medium" : "low";
  return { score, badge, breakdown: { completeness, verification, reviews } };
}

