import { prisma } from "@/lib/db";

export type SeoSuggestion = {
  listingId: string;
  titleSuggestion: string;
  metaDescription: string;
  structuredDataNote: string;
  reviewRequired: true;
};

function cad(n: number): string {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(n / 100);
}

/**
 * Produces SEO *drafts* from real listing fields — operators publish after review (no auto-index spam).
 */
export async function buildListingSeoSuggestion(listingId: string): Promise<SeoSuggestion | null> {
  const l = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    select: {
      id: true,
      title: true,
      city: true,
      municipality: true,
      propertyType: true,
      roomType: true,
      nightPriceCents: true,
      maxGuests: true,
      beds: true,
      bnhubListingReviewCount: true,
      bnhubListingRatingAverage: true,
    },
  });
  if (!l) return null;

  const area = l.municipality?.trim() || l.city;
  const titleSuggestion = `${l.title} — ${l.roomType ?? l.propertyType ?? "Stay"} in ${area} | BNHUB`;
  const price = cad(l.nightPriceCents);
  const rating =
    l.bnhubListingRatingAverage != null && l.bnhubListingReviewCount > 0
      ? `${l.bnhubListingRatingAverage.toFixed(1)}★ (${l.bnhubListingReviewCount} reviews)`
      : "New on BNHUB";
  const metaDescription = [
    `Book ${l.roomType ?? "this stay"} in ${area}. From ${price}/night.`,
    `${l.maxGuests} guests · ${l.beds} beds.`,
    rating + ". Secure checkout with Stripe on LECIPM.",
  ].join(" ");

  return {
    listingId: l.id,
    titleSuggestion: titleSuggestion.slice(0, 200),
    metaDescription: metaDescription.slice(0, 320),
    structuredDataNote: "Add JSON-LD VacationRental only after factual verification of address and availability.",
    reviewRequired: true,
  };
}
