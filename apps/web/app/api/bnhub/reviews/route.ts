import { NextRequest } from "next/server";
import { createReview } from "@/lib/bnhub/reviews";
import { canLeaveReview } from "@/lib/policy-engine";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      bookingId,
      guestId,
      listingId,
      propertyRating,
      hostRating,
      cleanlinessRating,
      communicationRating,
      locationRating,
      valueRating,
      comment,
    } = body;
    if (!bookingId || !guestId || !listingId || propertyRating == null) {
      return Response.json(
        { error: "bookingId, guestId, listingId, propertyRating required" },
        { status: 400 }
      );
    }
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: { status: true },
    });
    const decision = await canLeaveReview({
      bookingId,
      bookingStatus: booking?.status ?? undefined,
    });
    if (!decision.allowed) {
      return Response.json(
        { error: decision.reasonCode ?? "You can only review completed stays" },
        { status: 403 }
      );
    }
    const review = await createReview({
      bookingId,
      guestId,
      listingId,
      propertyRating: Number(propertyRating),
      hostRating: hostRating != null ? Number(hostRating) : undefined,
      cleanlinessRating: cleanlinessRating != null ? Number(cleanlinessRating) : undefined,
      communicationRating: communicationRating != null ? Number(communicationRating) : undefined,
      locationRating: locationRating != null ? Number(locationRating) : undefined,
      valueRating: valueRating != null ? Number(valueRating) : undefined,
      comment: comment ?? undefined,
    });
    return Response.json(review);
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Failed to create review" },
      { status: 400 }
    );
  }
}
