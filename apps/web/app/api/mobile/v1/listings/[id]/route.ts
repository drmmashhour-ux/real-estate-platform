import { prisma } from "@repo/db";
import { fetchListingCardWithQuality, fetchPublicListingCardsByIds, toPublicListingCard } from "@/lib/mobile/listingMobileDto";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = await fetchListingCardWithQuality(id);
  if (!row || row.listingStatus !== "PUBLISHED") {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  const safety = row.bnhubListingSafetyProfile;
  if (safety && !safety.listingVisible) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const reviews = await prisma.review.findMany({
    where: {
      listingId: id,
      OR: [{ bnhubModeration: { is: null } }, { bnhubModeration: { status: "VISIBLE" } }],
    },
    select: {
      id: true,
      propertyRating: true,
      comment: true,
      createdAt: true,
      guest: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  const similar = await prisma.shortTermListing.findMany({
    where: {
      city: row.city,
      listingStatus: "PUBLISHED",
      NOT: { id },
    },
    select: { id: true },
    take: 6,
  });

  const similarCards = await fetchPublicListingCardsByIds(similar.map((s) => s.id));

  return Response.json({
    listing: toPublicListingCard(row),
    reviews: reviews.map((r) => ({
      id: r.id,
      rating: r.propertyRating,
      comment: r.comment,
      createdAt: r.createdAt,
      guestName: r.guest.name ? `${r.guest.name.slice(0, 1)}.` : "Guest",
    })),
    similar: similarCards,
  });
}
