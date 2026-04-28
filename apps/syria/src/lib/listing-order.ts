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

/** SYBNB-42 — Verified subscribed hotels → featured plans → verified free → rest (within SYBNB stay browse). */
const SYBNB_BROWSE_TIER: Prisma.SyriaPropertyOrderByWithRelationInput = { sybnbBrowseTier: "desc" };

/** SYBNB-51 — denormalized ranking score (`sy8FeedRankScore`), then photo-count tie-break (SYBNB-65), then recency. */
const SY8_FEED_RANK: Prisma.SyriaPropertyOrderByWithRelationInput = { sy8FeedRankScore: "desc" };

/** ORDER SYBNB-65 — more photos break ties after score (matches browse intent). */
const LISTING_PHOTO_COUNT: Prisma.SyriaPropertyOrderByWithRelationInput = { listingPhotoCount: "desc" };

/**
 * Short-stay feed: tier-aware ordering for SYBNB discovery (same surfaces as main browse).
 */
export function listingBrowseOrderBySybnb(
  sort: string | undefined,
): Prisma.SyriaPropertyOrderByWithRelationInput[] {
  const s = sort ?? "featured";
  if (s === "price_asc") return [SYBNB_BROWSE_TIER, DIRECT_FIRST, SY8_FEED_RANK, LISTING_PHOTO_COUNT, { price: "asc" }];
  if (s === "price_desc") return [SYBNB_BROWSE_TIER, DIRECT_FIRST, SY8_FEED_RANK, LISTING_PHOTO_COUNT, { price: "desc" }];
  if (s === "new" || s === "newest") {
    return [SYBNB_BROWSE_TIER, DIRECT_FIRST, SY8_FEED_RANK, LISTING_PHOTO_COUNT, { plan: "desc" }, { createdAt: "desc" }];
  }
  return [SYBNB_BROWSE_TIER, DIRECT_FIRST, SY8_FEED_RANK, LISTING_PHOTO_COUNT, { plan: "desc" }, { createdAt: "desc" }];
}

export function listingBrowseOrderBy(sort: string | undefined): Prisma.SyriaPropertyOrderByWithRelationInput[] {
  const s = sort ?? "featured";
  if (s === "price_asc") return [DIRECT_FIRST, SY8_FEED_RANK, LISTING_PHOTO_COUNT, { price: "asc" }];
  if (s === "price_desc") return [DIRECT_FIRST, SY8_FEED_RANK, LISTING_PHOTO_COUNT, { price: "desc" }];
  if (s === "new" || s === "newest") {
    return [DIRECT_FIRST, SY8_FEED_RANK, LISTING_PHOTO_COUNT, { plan: "desc" }, { createdAt: "desc" }];
  }
  return [DIRECT_FIRST, SY8_FEED_RANK, LISTING_PHOTO_COUNT, { plan: "desc" }, { createdAt: "desc" }];
}
