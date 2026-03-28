import { prisma } from "@/lib/db";

export type PremiumPlacementQuote = {
  listingId: string;
  suggestedBoostCents: number;
  rationale: string;
};

/**
 * Premium placement / merchandising fee suggestion from trust + demand proxies.
 */
export async function suggestPremiumPlacementFee(listingId: string): Promise<PremiumPlacementQuote> {
  const listing = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    select: {
      nightPriceCents: true,
      city: true,
      listingVerificationStatus: true,
    },
  });
  if (!listing) {
    return { listingId, suggestedBoostCents: 0, rationale: "Listing not found" };
  }

  let mult = 0.02;
  if (listing.listingVerificationStatus === "VERIFIED") mult += 0.01;
  if (/montreal|quebec|laval/i.test(listing.city)) mult += 0.005;

  const suggestedBoostCents = Math.round(listing.nightPriceCents * mult);
  return {
    listingId,
    suggestedBoostCents,
    rationale: "Base 2% of nightly rate + verification / metro bump for featured slots.",
  };
}
