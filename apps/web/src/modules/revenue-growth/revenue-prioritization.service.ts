import { growthV3Flags } from "@/config/feature-flags";
import { prisma } from "@/lib/db";

export type RevenueWeightedListing = {
  fsboListingId: string;
  city: string;
  score: number;
  reasons: string[];
};

/**
 * Ranks FSBO inventory by observable monetization proxies — no predicted LTV.
 */
export async function prioritizeRevenueListings(limit = 30): Promise<RevenueWeightedListing[]> {
  if (!growthV3Flags.revenueGrowthV1) return [];

  const rows = await prisma.fsboListing.findMany({
    where: { status: "ACTIVE", moderationStatus: "APPROVED" },
    select: {
      id: true,
      city: true,
      paidPublishAt: true,
      publishPriceCents: true,
      featuredUntil: true,
      priceCents: true,
      _count: { select: { buyerListingViews: true } },
    },
    take: 200,
    orderBy: { updatedAt: "desc" },
  });

  const scored = rows.map((r) => {
    let score = 40;
    const reasons: string[] = [];
    if (r.paidPublishAt) {
      score += 25;
      reasons.push("paid_publish");
    }
    if (r.featuredUntil && r.featuredUntil > new Date()) {
      score += 15;
      reasons.push("featured_active");
    }
    if (r.publishPriceCents && r.publishPriceCents > 0) {
      score += 10;
      reasons.push("publish_fee_recorded");
    }
    score += Math.min(20, Math.floor(r.priceCents / 500_000_000));
    if (r._count.buyerListingViews > 0) reasons.push("has_view_activity");
    return { fsboListingId: r.id, city: r.city, score: Math.min(100, score), reasons };
  });

  return scored.sort((a, b) => b.score - a.score).slice(0, limit);
}
