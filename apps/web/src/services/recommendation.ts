import { ListingStatus, UserEventType } from "@prisma/client";
import { prisma } from "@/lib/db";

export type ListingRec = { id: string; listingCode: string; title: string; city: string; nightPriceCents: number };

/**
 * Hybrid recs: saved favorites (projects), geo proximity (BNHub), recent behavior (`user_events` LISTING_VIEW).
 */
export async function getRecommendedStaysForUser(userId: string, take = 8): Promise<ListingRec[]> {
  const [favProjects, views, profile] = await Promise.all([
    prisma.favoriteProject.findMany({
      where: { userId },
      take: 5,
      select: { project: { select: { city: true } } },
    }),
    prisma.userEvent.findMany({
      where: { userId, eventType: "LISTING_VIEW" },
      orderBy: { createdAt: "desc" },
      take: 12,
      select: { metadata: true },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { phone: true, name: true },
    }),
  ]);

  const cities = new Set<string>();
  for (const f of favProjects) {
    const c = f.project.city?.trim();
    if (c) cities.add(c);
  }
  for (const v of views) {
    const m = v.metadata as { listingId?: string } | null;
    if (m?.listingId) {
      const l = await prisma.shortTermListing.findUnique({
        where: { id: m.listingId },
        select: { city: true },
      });
      if (l?.city) cities.add(l.city);
    }
  }

  const cityList = [...cities].slice(0, 3);
  const or = cityList.length
    ? cityList.map((city) => ({ city: { contains: city, mode: "insensitive" as const } }))
    : [{ city: { contains: "Montreal", mode: "insensitive" as const } }];

  const rows = await prisma.shortTermListing.findMany({
    where: {
      listingStatus: ListingStatus.PUBLISHED,
      OR: or,
    },
    take,
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      listingCode: true,
      title: true,
      city: true,
      nightPriceCents: true,
    },
  });

  void profile;
  return rows;
}
