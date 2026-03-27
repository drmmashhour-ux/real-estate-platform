import { prisma } from "@/lib/db";
import { getRegionMarketTrendSummary } from "../infrastructure/marketTrendService";
import { slugRegionCity } from "../infrastructure/regionSlug";

/** Region trend for a listing's city + property type (90d investor window by default). */
export async function getMarketTrendForListing(
  listingId: string,
  options?: { windowDays?: 30 | 90 | 180 }
) {
  const listing = await prisma.fsboListing.findUnique({
    where: { id: listingId },
    select: { city: true, propertyType: true },
  });
  if (!listing) return null;
  const regionSlug = slugRegionCity(listing.city);
  const propertyType = (listing.propertyType || "unknown").toLowerCase();
  const windowDays = options?.windowDays ?? 90;
  return getRegionMarketTrendSummary(prisma, {
    regionSlug,
    propertyType,
    mode: "investor",
    windowDays,
  });
}
