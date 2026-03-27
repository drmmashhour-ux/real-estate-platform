/**
 * Host and Listing Optimization AI – recommendations for descriptions, photos, pricing, calendar.
 * Expose in host dashboards.
 */
import { prisma } from "@/lib/db";
import { getAiPricingRecommendation } from "@/lib/ai-pricing";
import { getListingRankingScore } from "@/lib/ai-ranking";

export type HostRecommendation = {
  type: string;
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  action?: string;
};

/**
 * Generate AI recommendations for a host's listing (description, photos, pricing, calendar).
 */
export async function getHostListingRecommendations(listingId: string): Promise<HostRecommendation[]> {
  const listing = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    include: { _count: { select: { reviews: true } } },
  });
  if (!listing) return [];

  const recs: HostRecommendation[] = [];
  const photoCount = Array.isArray(listing.photos) ? listing.photos.length : 0;
  if (photoCount < 5) {
    recs.push({
      type: "photos",
      priority: "high",
      title: "Add more photos",
      description: `Listings with 5+ photos convert better. You have ${photoCount}.`,
      action: "Add photos",
    });
  }
  if (!listing.description || listing.description.length < 100) {
    recs.push({
      type: "description",
      priority: "high",
      title: "Improve description",
      description: "Descriptions of 100+ characters help guests understand your space.",
      action: "Edit description",
    });
  }
  if (listing.verificationStatus !== "VERIFIED") {
    recs.push({
      type: "verification",
      priority: "high",
      title: "Complete verification",
      description: "Verified listings rank higher and build trust.",
      action: "Submit for verification",
    });
  }

  const pricing = await getAiPricingRecommendation(listingId, { store: false });
  const diffPct = (pricing.recommendedCents - listing.nightPriceCents) / listing.nightPriceCents;
  if (diffPct > 0.1) {
    recs.push({
      type: "pricing",
      priority: "medium",
      title: "Consider raising price",
      description: `Demand level is ${pricing.demandLevel}. Recommended around $${(pricing.recommendedCents / 100).toFixed(0)}/night.`,
    });
  } else if (diffPct < -0.1) {
    recs.push({
      type: "pricing",
      priority: "medium",
      title: "Consider lowering price",
      description: `Recommended around $${(pricing.recommendedCents / 100).toFixed(0)}/night for better occupancy.`,
    });
  }

  const rank = await getListingRankingScore(listingId);
  if (rank && rank.score < 30 && listing._count.reviews < 3) {
    recs.push({
      type: "reviews",
      priority: "medium",
      title: "Get more reviews",
      description: "Listings with more reviews rank higher. Encourage guests to leave reviews.",
    });
  }

  return recs;
}
