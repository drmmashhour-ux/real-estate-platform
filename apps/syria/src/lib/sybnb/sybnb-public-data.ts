import type { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/db";
import { listingBrowseOrderBySybnb } from "@/lib/listing-order";
import { sy8FeedExtraWhere } from "@/lib/sy8/sy8-feed-visibility";

/** Public SYBNB stay feed — `sy8FeedExtraWhere` + stay-only gates (aligned with `buildPropertyWhere` for `kind: "stay"`). */
const sybnbBrowseWhere: Prisma.SyriaPropertyWhereInput = {
  ...sy8FeedExtraWhere,
  category: "stay",
  type: "RENT",
  status: "PUBLISHED",
  sybnbReview: "APPROVED",
  fraudFlag: false,
  owner: { flagged: false, sybnbSupplyPaused: false },
};

/**
 * Public SYBNB hub: published, approved short-stay rows only. SYBNB-7: never throw to page on DB hiccup.
 */
export async function getSybnbPublicListingCount(): Promise<number> {
  try {
    return await prisma.syriaProperty.count({ where: sybnbBrowseWhere });
  } catch (e) {
    console.error("[SYBNB] getSybnbPublicListingCount", e instanceof Error ? e.message : e);
    return 0;
  }
}

export async function getSybnbLatestStays(take: number) {
  try {
    return await prisma.syriaProperty.findMany({
      where: sybnbBrowseWhere,
      take,
      orderBy: listingBrowseOrderBySybnb("newest"),
      include: { owner: { select: { verifiedAt: true, verificationLevel: true, phoneVerifiedAt: true } } },
    });
  } catch (e) {
    console.error("[SYBNB] getSybnbLatestStays", e instanceof Error ? e.message : e);
    return [];
  }
}

export async function getHostSybnbStats(ownerId: string) {
  try {
    const [listingCount, completedStays] = await Promise.all([
      prisma.syriaProperty.count({ where: { ownerId, category: "stay" } }),
      prisma.syriaBooking.count({
        where: {
          status: "COMPLETED",
          property: { ownerId, category: "stay" },
        },
      }),
    ]);
    return { listingCount, completedStays };
  } catch (e) {
    console.error("[SYBNB] getHostSybnbStats", e instanceof Error ? e.message : e);
    return { listingCount: 0, completedStays: 0 };
  }
}
