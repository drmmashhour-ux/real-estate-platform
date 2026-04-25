/**
 * "Recommended for you" — rule-based from recent views + published inventory.
 */

import { prisma } from "@/lib/db";

const WINDOW = 45;

export type UserListingRecommendation = {
  listingId: string;
  title: string;
  city: string;
  nightPriceCents: number;
  score: number;
  explanation: string;
};

export async function getRecommendationsForUser(userId: string, limit = 8): Promise<UserListingRecommendation[]> {
  const since = new Date();
  since.setDate(since.getDate() - WINDOW);

  const views = await prisma.aiUserActivityLog.findMany({
    where: { userId, eventType: "listing_view", createdAt: { gte: since } },
    select: { listingId: true },
    orderBy: { createdAt: "desc" },
    take: 40,
  });

  const viewedIds = [...new Set(views.map((v) => v.listingId).filter(Boolean) as string[])];

  const cities = new Set<string>();
  if (viewedIds.length) {
    const meta = await prisma.shortTermListing.findMany({
      where: { id: { in: viewedIds.slice(0, 15) } },
      select: { city: true, beds: true, nightPriceCents: true },
    });
    for (const m of meta) cities.add(m.city);
  }

  const cityList = [...cities];
  if (cityList.length === 0) {
    cityList.push("Montreal", "Toronto", "Quebec");
  }

  const candidates = await prisma.shortTermListing.findMany({
    where: {
      listingStatus: "PUBLISHED",
      city: { in: cityList.slice(0, 5) },
      NOT: viewedIds.length ? { id: { in: viewedIds } } : undefined,
    },
    select: {
      id: true,
      title: true,
      city: true,
      nightPriceCents: true,
      beds: true,
    },
    take: 40,
    orderBy: { createdAt: "desc" },
  });

  const out: UserListingRecommendation[] = [];
  for (const c of candidates) {
    let score = 40;
    const reasons: string[] = [];
    if (cities.has(c.city)) {
      score += 30;
      reasons.push(`Same city as your recent views (${c.city})`);
    }
    score += Math.min(20, Math.floor(c.nightPriceCents / 50_000));
    reasons.push("Published listing");
    out.push({
      listingId: c.id,
      title: c.title,
      city: c.city,
      nightPriceCents: c.nightPriceCents,
      score: Math.min(100, score),
      explanation: reasons.join(". "),
    });
  }

  out.sort((a, b) => b.score - a.score);

  const top = out.slice(0, limit);
  for (const r of top) {
    await prisma.aiRecommendationHistory
      .create({
        data: {
          userId,
          listingId: r.listingId,
          source: "behavior_similar",
          rankScore: r.score,
          explanation: r.explanation,
        },
      })
      .catch(() => {});
  }

  return top;
}
