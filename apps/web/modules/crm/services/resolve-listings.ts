import { prisma } from "@/lib/db";

export async function resolveListingTitles(listingIds: string[]) {
  if (listingIds.length === 0) return new Map<string, { title: string | null; price: number | null }>();
  const rows = await prisma.listing.findMany({
    where: { id: { in: listingIds } },
    select: { id: true, title: true, price: true },
  });
  const map = new Map<string, { title: string | null; price: number | null }>();
  for (const r of rows) {
    map.set(r.id, { title: r.title, price: r.price });
  }
  return map;
}
