import type { PrismaClient } from "@prisma/client";

/**
 * Graph-style deterministic signals: duplicate media URLs across listings.
 */
export async function findDuplicateImageListingIds(
  db: PrismaClient,
  listingId: string,
  imageUrls: string[]
): Promise<string[]> {
  const out = new Set<string>();
  const urls = imageUrls.map((u) => u.trim()).filter(Boolean);
  for (const url of urls) {
    const rows = await db.fsboListing.findMany({
      where: {
        id: { not: listingId },
        images: { has: url },
      },
      select: { id: true },
      take: 20,
    });
    for (const r of rows) out.add(r.id);
  }
  return [...out];
}
