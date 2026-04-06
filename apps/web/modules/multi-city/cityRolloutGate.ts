import type { PrismaClient } from "@prisma/client";

/**
 * When `lecipm_cities` has a row for `slug`, search/SEO city pages require `searchPagesEnabled`.
 * Missing row = allow (legacy routes before migration).
 */
export async function isCitySearchPageEnabled(db: PrismaClient, slug: string): Promise<boolean> {
  const row = await db.city.findUnique({
    where: { slug },
    select: { searchPagesEnabled: true },
  });
  if (!row) return true;
  return row.searchPagesEnabled;
}
