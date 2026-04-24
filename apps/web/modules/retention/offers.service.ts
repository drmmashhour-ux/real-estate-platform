/**
 * Personalized offer *suggestions* — informational; hosts set real prices.
 */
import { prisma } from "@/lib/db";

export type PriceAlertSuggestion = {
  listingId: string;
  listingCode: string;
  title: string;
  currentNightPriceCents: number;
  currency: string;
  message: string;
  logicExplanation: string;
};

/** Describe a watch‑style alert without promising a price drop or deadline. */
export async function buildPriceAlertSuggestionsForGuest(
  userId: string,
  max = 3
): Promise<PriceAlertSuggestion[]> {
  const favs = await prisma.bnhubGuestFavorite.findMany({
    where: { guestUserId: userId },
    take: max,
    orderBy: { createdAt: "desc" },
    select: {
      listing: {
        select: {
          id: true,
          listingCode: true,
          title: true,
          nightPriceCents: true,
          currency: true,
        },
      },
    },
  });

  return favs.map((f) => ({
    listingId: f.listing.id,
    listingCode: f.listing.listingCode,
    title: f.listing.title,
    currentNightPriceCents: f.listing.nightPriceCents,
    currency: f.listing.currency,
    message: `“${f.listing.title}” is currently listed around ${(f.listing.nightPriceCents / 100).toFixed(0)} ${f.listing.currency} per night. You can check the listing for the latest host‑set price before booking.`,
    logicExplanation:
      "Uses only the live listing nightly rate at query time — no fabricated discounts or expiring offers.",
  }));
}
