import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";

/**
 * GET — Guest or host: see whether post-stay evaluations are pending / done for this booking.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getGuestId();
  if (!userId) {
    return Response.json({ error: "Sign in required" }, { status: 401 });
  }

  const { id: bookingId } = await params;
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      status: true,
      guestId: true,
      listing: { select: { id: true, ownerId: true, title: true } },
    },
  });
  if (!booking) {
    return Response.json({ error: "Booking not found" }, { status: 404 });
  }

  const isGuest = booking.guestId === userId;
  const isHost = booking.listing.ownerId === userId;
  if (!isGuest && !isHost) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const [guestReview, hostReview] = await Promise.all([
    prisma.review.findUnique({
      where: { bookingId },
      select: {
        id: true,
        aiCompositeScore: true,
        aiSummary: true,
        amenitiesAsAdvertised: true,
      },
    }),
    prisma.bnhubHostReviewOfGuest.findUnique({
      where: { bookingId },
      select: {
        id: true,
        aiCompositeScore: true,
        aiSummary: true,
        theftOrDamageReported: true,
      },
    }),
  ]);

  const completed = booking.status === "COMPLETED";

  return Response.json({
    bookingId,
    listingId: booking.listing.id,
    listingTitle: booking.listing.title,
    stayCompleted: completed,
    guestEvaluation: {
      role: "guest",
      isYou: isGuest,
      pending: completed && isGuest && !guestReview,
      submitted: Boolean(guestReview),
      summary: guestReview
        ? {
            aiCompositeScore: guestReview.aiCompositeScore,
            aiSummary: guestReview.aiSummary,
            amenitiesAsAdvertised: guestReview.amenitiesAsAdvertised,
          }
        : null,
    },
    hostEvaluation: {
      role: "host",
      isYou: isHost,
      pending: completed && isHost && !hostReview,
      submitted: Boolean(hostReview),
      summary: hostReview
        ? {
            aiCompositeScore: hostReview.aiCompositeScore,
            aiSummary: hostReview.aiSummary,
            theftOrDamageReported: hostReview.theftOrDamageReported,
          }
        : null,
    },
  });
}
