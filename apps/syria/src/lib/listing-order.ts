import type { Prisma } from "@/generated/prisma";

export function listingBrowseOrderBy(sort: string | undefined): Prisma.SyriaPropertyOrderByWithRelationInput[] {
  const s = sort ?? "featured";
  if (s === "price_asc") return [{ price: "asc" }];
  if (s === "price_desc") return [{ price: "desc" }];
  if (s === "new" || s === "newest") return [{ createdAt: "desc" }];
  return [{ isFeatured: "desc" }, { createdAt: "desc" }];
}
