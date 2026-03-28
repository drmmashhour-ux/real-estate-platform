import { ListingStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { applyRegionMultiplier } from "@/src/modules/global/regionPricing";

export async function handlePublicListingsGET(searchParams: URLSearchParams) {
  const country = (searchParams.get("country") ?? "US").slice(0, 2).toUpperCase();
  const limit = Math.min(Math.max(Number(searchParams.get("limit") ?? 20) || 20, 1), 50);

  const rows = await prisma.shortTermListing.findMany({
    where: {
      listingStatus: ListingStatus.PUBLISHED,
      country: { equals: country, mode: "insensitive" },
    },
    take: limit,
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      listingCode: true,
      title: true,
      city: true,
      country: true,
      nightPriceCents: true,
      currency: true,
    },
  });

  const listings = await Promise.all(
    rows.map(async (r) => ({
      id: r.id,
      listingCode: r.listingCode,
      title: r.title,
      city: r.city,
      country: r.country,
      currency: r.currency,
      nightPriceCents: r.nightPriceCents,
      regionAdjustedNightPriceCents: await applyRegionMultiplier(r.nightPriceCents, country),
    }))
  );

  return { country, limit, listings };
}
