import type { Prisma } from "@/generated/prisma";

/**
 * Optional autonomy/risk notes for UI copy — does not alter SQL order (see `listingBrowseOrderBy`).
 */
export function describeListingSortAutonomyOverlay(
  sort: string | undefined,
  autonomyNotes: readonly string[] | undefined,
): string | null {
  const base =
    sort === "price_asc" || sort === "price_desc" ?
      "price_sort"
    : sort === "new" || sort === "newest" ?
      "newest_sort"
    : "featured_default";
  if (!autonomyNotes || autonomyNotes.length === 0) return null;
  return `${base}: ${autonomyNotes.slice(0, 2).join(" · ")}`;
}

const DIRECT_FIRST: Prisma.SyriaPropertyOrderByWithRelationInput = { isDirect: "desc" };

/** SY8: denormalized feed score (location + trust + bookings), then monetization tier, then recency. */
const SY8_FEED_RANK: Prisma.SyriaPropertyOrderByWithRelationInput = { sy8FeedRankScore: "desc" };

/**
 * Short-stay feed: same ordering as the main browse surface.
 */
export function listingBrowseOrderBySybnb(
  sort: string | undefined,
): Prisma.SyriaPropertyOrderByWithRelationInput[] {
  return listingBrowseOrderBy(sort);
}

export function listingBrowseOrderBy(sort: string | undefined): Prisma.SyriaPropertyOrderByWithRelationInput[] {
  const s = sort ?? "featured";
  if (s === "price_asc") return [DIRECT_FIRST, SY8_FEED_RANK, { price: "asc" }];
  if (s === "price_desc") return [DIRECT_FIRST, SY8_FEED_RANK, { price: "desc" }];
  if (s === "new" || s === "newest") {
    return [DIRECT_FIRST, SY8_FEED_RANK, { plan: "desc" }, { createdAt: "desc" }];
  }
  return [DIRECT_FIRST, SY8_FEED_RANK, { plan: "desc" }, { createdAt: "desc" }];
}
