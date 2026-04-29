import "server-only";

import { getLegacyDB } from "@/lib/db/legacy";

const prisma = getLegacyDB();

/** Guest-facing advisory bundle for a listing — informational only. */
export async function getBuyerAdvisory(listingId: string) {
  const listing = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    select: {
      id: true,
      title: true,
      city: true,
      region: true,
      country: true,
      nightPriceCents: true,
    },
  });
  if (!listing) return null;

  const locality = `${listing.city}${listing.region ? `, ${listing.region}` : ""}`;
  const nightUsd = listing.nightPriceCents != null ? (listing.nightPriceCents / 100).toFixed(2) : null;

  return {
    listingId: listing.id,
    title: listing.title,
    locality,
    country: listing.country,
    nightPriceUsd: nightUsd,
    advisory: {
      riskLevel: "medium" as const,
      bullets: [`Verify availability, house rules, and total price breakdown for ${listing.title}.`, locality],
      notes:
        typeof nightUsd === "string"
          ? `Quoted nightly rate from listings data: $${nightUsd} (${listing.country}).`
          : "No nightly rate on file — confirm with the host.",
    },
  };
}
