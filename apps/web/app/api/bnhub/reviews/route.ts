import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { createReview } from "@/lib/bnhub/reviews";
import { canLeaveReview } from "@/lib/policy-engine";
import { prisma } from "@repo/db";

/** @deprecated Prefer POST /api/reviews (session-based). Body guestId ignored when signed in. */
export async function POST(request: NextRequest) {
  try {
    const sessionUserId = await getGuestId();
    const body = await request.json();
    const {
      bookingId,
      guestId: bodyGuestId,
      listingId,
      propertyRating,
      hostRating,
      cleanlinessRating,
      accuracyRating,
      communicationRating,
      locationRating,
      valueRating,
      checkinRating,
      comment,
      stayChecklist,
      amenitiesAsAdvertised,
    } = body;
    const guestId = sessionUserId ?? bodyGuestId;
    if (!bookingId || !guestId || !listingId || propertyRating == null) {
      return Response.json(
        { error: "bookingId, listingId, propertyRating required; sign in or pass guestId for legacy demos" },
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
      accuracyRating: accuracyRating != null ? Number(accuracyRating) : undefined,
      communicationRating: communicationRating != null ? Number(communicationRating) : undefined,
      locationRating: locationRating != null ? Number(locationRating) : undefined,
      valueRating: valueRating != null ? Number(valueRating) : undefined,
      checkinRating: checkinRating != null ? Number(checkinRating) : undefined,
      comment: comment ?? undefined,
      stayChecklist:
        stayChecklist && typeof stayChecklist === "object" ? stayChecklist : undefined,
      amenitiesAsAdvertised:
        typeof amenitiesAsAdvertised === "boolean" ? amenitiesAsAdvertised : undefined,
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
