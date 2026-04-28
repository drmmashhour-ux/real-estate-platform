import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import { SYRIA_HOME_FEED_CACHE_SECONDS } from "@/lib/syria/sybn104-performance";
import type { Prisma, SyriaProperty } from "@/generated/prisma";
import { sy8FeedExtraWhere } from "@/lib/sy8/sy8-feed-visibility";

export type HomeListingWithOwner = SyriaProperty & {
  owner: { phoneVerifiedAt: Date | null; verifiedAt: Date | null; verificationLevel: string | null };
};

const sy8HomeOrder: Prisma.SyriaPropertyOrderByWithRelationInput[] = [
  { isDirect: "desc" },
  { owner: { verifiedAt: { sort: "desc", nulls: "last" } } },
  { plan: "desc" },
  { createdAt: "desc" },
];

/**
 * ORDER SYBNB-82 — Short ISR-style cache for homepage grids (Canada DB work; CDN serves HTML from edge when combined with page revalidate).
 */
export async function getCachedDarlinkHomeListingFeeds(includeBnhubSlice: boolean): Promise<{
  latestListings: HomeListingWithOwner[];
  publishedCount: number;
  bnhubRows: HomeListingWithOwner[];
}> {
  return unstable_cache(
    async () => {
      try {
        const [rows, count] = await prisma.$transaction([
          prisma.syriaProperty.findMany({
            where: { status: "PUBLISHED", fraudFlag: false, ...sy8FeedExtraWhere },
            orderBy: sy8HomeOrder,
            take: 10,
            include: { owner: { select: { phoneVerifiedAt: true, verifiedAt: true, verificationLevel: true } } },
          }),
          prisma.syriaProperty.count({
            where: { status: "PUBLISHED", fraudFlag: false, ...sy8FeedExtraWhere },
          }),
        ]);
        let bnhubRows: HomeListingWithOwner[] = [];
        if (includeBnhubSlice) {
          bnhubRows = await prisma.syriaProperty.findMany({
            where: { type: "BNHUB", status: "PUBLISHED", fraudFlag: false, ...sy8FeedExtraWhere },
            orderBy: sy8HomeOrder,
            take: 4,
            include: { owner: { select: { phoneVerifiedAt: true, verifiedAt: true, verificationLevel: true } } },
          });
        }
        return {
          latestListings: rows as HomeListingWithOwner[],
          publishedCount: count,
          bnhubRows,
        };
      } catch {
        return { latestListings: [], publishedCount: 0, bnhubRows: [] };
      }
    },
    ["darlink-home-feeds-v1", includeBnhubSlice ? "bnhub" : "nobnhub"],
    { revalidate: SYRIA_HOME_FEED_CACHE_SECONDS, tags: ["darlink-home-listings"] },
  )();
}
