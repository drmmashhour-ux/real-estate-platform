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

const PHONE_VERIFIED_FIRST: Prisma.SyriaPropertyOrderByWithRelationInput = {
  owner: { phoneVerifiedAt: "desc" },
};

/**
 * Short-stay feed: same as browse, but phone-verified hosts surface earlier (trust).
 */
export function listingBrowseOrderBySybnb(
  sort: string | undefined,
): Prisma.SyriaPropertyOrderByWithRelationInput[] {
  const base = listingBrowseOrderBy(sort);
  return [DIRECT_FIRST, PHONE_VERIFIED_FIRST, ...base.slice(1)];
}

export function listingBrowseOrderBy(sort: string | undefined): Prisma.SyriaPropertyOrderByWithRelationInput[] {
  const s = sort ?? "featured";
  if (s === "price_asc") return [DIRECT_FIRST, { price: "asc" }];
  if (s === "price_desc") return [DIRECT_FIRST, { price: "desc" }];
  if (s === "new" || s === "newest") return [DIRECT_FIRST, { createdAt: "desc" }];
  return [DIRECT_FIRST, { plan: "desc" }, { createdAt: "desc" }];
}
