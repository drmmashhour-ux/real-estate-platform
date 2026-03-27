import { fetchPublicListingCardsByIds, listPublishedListingIdsVisibleToGuest } from "@/lib/mobile/listingMobileDto";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city")?.trim();
  const guests = searchParams.get("guests");
  const minPrice = searchParams.get("minPriceCents");
  const maxPrice = searchParams.get("maxPriceCents");

  const where: Record<string, unknown> = {};
  if (city) {
    where.city = { contains: city, mode: "insensitive" };
  }
  if (guests) {
    const g = parseInt(guests, 10);
    if (!Number.isNaN(g)) where.maxGuests = { gte: g };
  }
  if (minPrice || maxPrice) {
    where.nightPriceCents = {};
    if (minPrice) (where.nightPriceCents as Record<string, number>).gte = parseInt(minPrice, 10);
    if (maxPrice) (where.nightPriceCents as Record<string, number>).lte = parseInt(maxPrice, 10);
  }

  const ids = await listPublishedListingIdsVisibleToGuest(where, 40);
  const listings = await fetchPublicListingCardsByIds(ids);
  return Response.json({ listings, total: listings.length });
}
