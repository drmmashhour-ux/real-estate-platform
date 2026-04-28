import type { SyriaProperty } from "@/generated/prisma";

/**
 * SYBNB-42 — Denormalized browse tier for stay search ordering (higher sorts first).
 *
 * 4 — Verified hotels on `hotel_featured` (hotel subscription; requires trust flags).
 * 3 — Featured listings (`featured` | `premium` | `hotel_featured` when not tier 4).
 * 2 — Verified “normal” (listing or marketplace verified, typically free tier).
 * 1 — Everything else eligible for the feed.
 * 0 — Fraud-flagged rows (excluded from guest browse via `buildPropertyWhere`; kept for consistency).
 */
export function computeSybnbBrowseTier(
  p: Pick<SyriaProperty, "type" | "plan" | "listingVerified" | "verified" | "fraudFlag">,
): number {
  if (p.fraudFlag) return 0;

  const trust = Boolean(p.listingVerified) || Boolean(p.verified);
  const isHotel = p.type === "HOTEL";
  const hotelFeaturedPlan = p.plan === "hotel_featured";

  if (isHotel && hotelFeaturedPlan && trust) return 4;

  if (p.plan === "featured" || p.plan === "premium" || hotelFeaturedPlan) return 3;

  if (trust) return 2;

  return 1;
}
