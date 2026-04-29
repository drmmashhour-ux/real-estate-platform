import "server-only";

import { ListingStatus } from "@prisma/client";
import { getLegacyDB } from "@/lib/db/legacy";

const prisma = getLegacyDB();

type RecommendRow = {
  id: string;
  title: string;
  city: string;
  nightPriceCents: number;
  listingPhotos: { url: string }[];
  photos: unknown;
};

export async function getUnifiedRecommendations(userId: string, take: number): Promise<RecommendRow[]> {
  void userId;
  try {
    return await prisma.shortTermListing.findMany({
      where: { listingStatus: ListingStatus.PUBLISHED },
      take,
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        city: true,
        nightPriceCents: true,
        listingPhotos: { take: 1, select: { url: true } },
        photos: true,
      },
    });
  } catch {
    return [];
  }
}
