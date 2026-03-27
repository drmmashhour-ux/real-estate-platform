import { prisma } from "@/lib/db";
import { computeAndUpsertHostQuality } from "./host-quality";

export async function createReview(data: {
  bookingId: string;
  guestId: string;
  listingId: string;
  propertyRating: number;
  hostRating?: number;
  cleanlinessRating?: number;
  communicationRating?: number;
  locationRating?: number;
  valueRating?: number;
  comment?: string;
}) {
  if (data.propertyRating < 1 || data.propertyRating > 5)
    throw new Error("Property rating must be 1-5");
  if (data.hostRating != null && (data.hostRating < 1 || data.hostRating > 5))
    throw new Error("Host rating must be 1-5");
  [data.cleanlinessRating, data.communicationRating, data.locationRating, data.valueRating].forEach((r, i) => {
    if (r != null && (r < 1 || r > 5))
      throw new Error(["Cleanliness", "Communication", "Location", "Value"][i] + " rating must be 1-5");
  });

  const booking = await prisma.booking.findUniqueOrThrow({
    where: { id: data.bookingId },
  });
  if (booking.guestId !== data.guestId) throw new Error("Not your booking");
  if (booking.status !== "COMPLETED") throw new Error("Can only review completed stays");

  const existing = await prisma.review.findUnique({
    where: { bookingId: data.bookingId },
  });
  if (existing) throw new Error("Already reviewed");

  const review = await prisma.review.create({
    data: {
      bookingId: data.bookingId,
      guestId: data.guestId,
      listingId: data.listingId,
      propertyRating: data.propertyRating,
      hostRating: data.hostRating ?? undefined,
      cleanlinessRating: data.cleanlinessRating ?? undefined,
      communicationRating: data.communicationRating ?? undefined,
      locationRating: data.locationRating ?? undefined,
      valueRating: data.valueRating ?? undefined,
      comment: data.comment ?? undefined,
      createdAt: new Date(),
    },
  });
  const listing = await prisma.shortTermListing.findUnique({
    where: { id: data.listingId },
    select: { ownerId: true },
  });
  if (listing) void computeAndUpsertHostQuality(listing.ownerId);
  return review;
}

export async function getListingReviews(listingId: string, limit = 10) {
  return prisma.review.findMany({
    where: { listingId },
    include: { guest: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export function getListingAverageRating(reviews: { propertyRating: number }[]) {
  if (reviews.length === 0) return null;
  const sum = reviews.reduce((a, r) => a + r.propertyRating, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}
