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

export function listingBrowseOrderBy(sort: string | undefined): Prisma.SyriaPropertyOrderByWithRelationInput[] {
  const s = sort ?? "featured";
  if (s === "price_asc") return [{ price: "asc" }];
  if (s === "price_desc") return [{ price: "desc" }];
  if (s === "new" || s === "newest") return [{ createdAt: "desc" }];
  return [{ isFeatured: "desc" }, { createdAt: "desc" }];
}
