import { fetchPublicListingCardsByIds, listPublishedListingIdsVisibleToGuest } from "@/lib/mobile/listingMobileDto";
import { formatMinorUnits } from "@/modules/expansion/locale-currency";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const locale = request.headers.get("accept-language")?.split(",")[0]?.trim() || "en";
  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city")?.trim();
  const countryCode = searchParams.get("country")?.trim() || searchParams.get("countryCode")?.trim();
  const marketCityId = searchParams.get("marketCityId")?.trim();
  const guests = searchParams.get("guests");
  const minPrice = searchParams.get("minPriceCents");
  const maxPrice = searchParams.get("maxPriceCents");

  const where: Record<string, unknown> = {};
  if (city) {
    where.city = { contains: city, mode: "insensitive" };
  }
  if (countryCode) {
    where.OR = [
      { marketCountry: { is: { code: { equals: countryCode, mode: "insensitive" } } } },
      { AND: [{ marketCountryId: null }, { country: { equals: countryCode, mode: "insensitive" } }] },
    ];
  }
  if (marketCityId) {
    where.marketCityId = marketCityId;
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
  const withDisplay = listings.map((l) => ({
    ...l,
    priceDisplay: formatMinorUnits(l.nightPriceCents, l.currency || "USD", locale),
  }));
  return Response.json({ listings: withDisplay, total: withDisplay.length });
}
