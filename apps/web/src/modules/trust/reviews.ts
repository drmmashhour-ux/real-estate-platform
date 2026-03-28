import { prisma } from "@/lib/db";

export type PublicReviewRow = {
  id: string;
  propertyRating: number;
  comment: string | null;
  createdAt: Date;
  guestName: string | null;
};

const TAKE = 20;

export async function listPublicReviewsForListing(listingId: string, take = TAKE): Promise<PublicReviewRow[]> {
  const rows = await prisma.review.findMany({
    where: { listingId },
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      propertyRating: true,
      comment: true,
      createdAt: true,
      guest: { select: { name: true } },
    },
  });
  return rows.map((r) => ({
    id: r.id,
    propertyRating: r.propertyRating,
    comment: r.comment,
    createdAt: r.createdAt,
    guestName: r.guest.name,
  }));
}
