import "server-only";

import { ListingStatus } from "@prisma/client";
import { prisma } from "@/lib/db";

/**
 * Markets index — distinct cities observed on short-term listings (best-effort).
 */
export async function listDistinctCitiesWithData(): Promise<string[]> {
  const rows = await prisma.shortTermListing
    .findMany({
      where: {
        listingStatus: ListingStatus.PUBLISHED,
        NOT: [{ city: "" }],
      },
      select: { city: true },
      distinct: ["city"],
      take: 250,
      orderBy: { city: "asc" },
    })
    .catch(() => [] as { city: string }[]);

  return rows.map((r) => r.city).filter(Boolean);
}
