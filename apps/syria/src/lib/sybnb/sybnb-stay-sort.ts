import type { SyriaListingPlan, SyriaProperty } from "@/generated/prisma";

/** Tie-break when distance or client-side sorts must mirror SYBNB browse ordering (tier → direct → SY8 score → photo count → plan strength → recency). */
const PLAN_RANK: Record<SyriaListingPlan, number> = {
  free: 0,
  featured: 2,
  premium: 4,
  hotel_featured: 3,
};

export function compareSybnbStayBrowseTieBreak(
  a: Pick<
    SyriaProperty,
    "sybnbBrowseTier" | "isDirect" | "sy8FeedRankScore" | "listingPhotoCount" | "plan" | "createdAt"
  >,
  b: Pick<
    SyriaProperty,
    "sybnbBrowseTier" | "isDirect" | "sy8FeedRankScore" | "listingPhotoCount" | "plan" | "createdAt"
  >,
): number {
  const tier = (b.sybnbBrowseTier ?? 1) - (a.sybnbBrowseTier ?? 1);
  if (tier !== 0) return tier;
  if (a.isDirect !== b.isDirect) return a.isDirect ? -1 : 1;
  const sy = (b.sy8FeedRankScore ?? 0) - (a.sy8FeedRankScore ?? 0);
  if (sy !== 0) return sy;
  const pics = (b.listingPhotoCount ?? 0) - (a.listingPhotoCount ?? 0);
  if (pics !== 0) return pics;
  const pa = PLAN_RANK[a.plan];
  const pb = PLAN_RANK[b.plan];
  if (pb !== pa) return pb - pa;
  return b.createdAt.getTime() - a.createdAt.getTime();
}
