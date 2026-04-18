import { prisma } from "@/lib/db";
import { ListingStatus } from "@prisma/client";

/**
 * Read-only comp context: median nightly in same city for published peers (excludes subject id).
 */
export async function getCityPeerPriceStats(city: string, excludeListingId: string): Promise<{
  medianCents: number | null;
  sampleSize: number;
}> {
  const c = city?.trim();
  if (!c) return { medianCents: null, sampleSize: 0 };

  const rows = await prisma.shortTermListing.findMany({
    where: {
      listingStatus: ListingStatus.PUBLISHED,
      city: { equals: c, mode: "insensitive" },
      id: { not: excludeListingId },
      nightPriceCents: { gt: 0 },
    },
    select: { nightPriceCents: true },
    take: 400,
  });

  const nums = rows.map((r) => r.nightPriceCents).filter((n) => n > 0).sort((a, b) => a - b);
  if (nums.length === 0) return { medianCents: null, sampleSize: 0 };
  const mid = Math.floor(nums.length / 2);
  const median =
    nums.length % 2 === 0 ? Math.round((nums[mid - 1]! + nums[mid]!) / 2) : nums[mid]!;
  return { medianCents: median, sampleSize: nums.length };
}
