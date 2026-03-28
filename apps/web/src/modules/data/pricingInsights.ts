import { ListingStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getBestListings } from "@/src/modules/ai/growthEngine";

export async function medianNightlyByCountry(countryCode: string) {
  const rows = await prisma.shortTermListing.findMany({
    where: {
      listingStatus: ListingStatus.PUBLISHED,
      country: { equals: countryCode, mode: "insensitive" },
    },
    select: { nightPriceCents: true },
    take: 500,
  });
  if (!rows.length) return { countryCode, medianCents: null as number | null, sample: 0 };
  const sorted = [...rows.map((r) => r.nightPriceCents)].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const medianCents = sorted.length % 2 ? sorted[mid]! : Math.round((sorted[mid - 1]! + sorted[mid]!) / 2);
  return { countryCode, medianCents, sample: sorted.length };
}

export async function topDemandListingsForPricing(sinceDays = 14, take = 8) {
  return getBestListings(sinceDays, take);
}
