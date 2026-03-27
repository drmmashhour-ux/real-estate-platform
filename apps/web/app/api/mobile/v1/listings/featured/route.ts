import { fetchPublicListingCardsByIds, listPublishedListingIdsVisibleToGuest } from "@/lib/mobile/listingMobileDto";

export const dynamic = "force-dynamic";

export async function GET() {
  const ids = await listPublishedListingIdsVisibleToGuest({}, 24);
  const listings = await fetchPublicListingCardsByIds(ids.slice(0, 12));
  return Response.json({ listings });
}
