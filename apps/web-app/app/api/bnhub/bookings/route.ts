import { NextRequest } from "next/server";
import { createBooking } from "@/lib/bnhub/booking";
import { isListingAvailable } from "@/lib/bnhub/listings";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { isBookingRestrictedFor } from "@/lib/operational-controls";
import { canConfirmBooking } from "@/lib/policy-engine";
import { recordPlatformEvent } from "@/lib/observability";
import { getFraudScore } from "@/lib/ai-fraud";
import { isUserRestricted } from "@/lib/defense/abuse-prevention";

export async function POST(request: NextRequest) {
  try {
    const guestId = await getGuestId();
    if (!guestId) {
      return Response.json(
        { error: "Sign in required to book" },
        { status: 401 }
      );
    }
    const restriction = await isUserRestricted(guestId);
    if (restriction.banned) {
      return Response.json(
        { error: "Account is not permitted to book" },
        { status: 403 }
      );
    }
    if (restriction.suspended) {
      return Response.json(
        { error: "Account is temporarily restricted" },
        { status: 403 }
      );
    }
    const body = await request.json();
    const { listingId, checkIn, checkOut, guestNotes } = body;
    if (!listingId || !checkIn || !checkOut) {
      return Response.json(
        { error: "listingId, checkIn, checkOut required" },
        { status: 400 }
      );
    }
    const listingMeta = await prisma.shortTermListing.findUnique({
      where: { id: listingId },
      select: { city: true, listingStatus: true, owner: { select: { accountStatus: true } } },
    });
    if (!listingMeta) {
      return Response.json({ error: "Listing not found" }, { status: 404 });
    }
    const blockedStatuses = ["UNDER_INVESTIGATION", "FROZEN", "REJECTED_FOR_FRAUD", "PERMANENTLY_REMOVED", "SUSPENDED"];
    if (listingMeta.listingStatus && blockedStatuses.includes(listingMeta.listingStatus)) {
      return Response.json(
        { error: "This listing is not available for booking" },
        { status: 403 }
      );
    }
    if (listingMeta.owner?.accountStatus && listingMeta.owner.accountStatus !== "ACTIVE") {
      return Response.json(
        { error: "Bookings are not available for this listing" },
        { status: 403 }
      );
    }
    const region = listingMeta.city;
    const restricted = await isBookingRestrictedFor({ listingId, region });
    if (restricted) {
      return Response.json(
        { error: "Bookings are currently restricted for this listing or region" },
        { status: 403 }
      );
    }
    const guestFraudScore = await getFraudScore("USER", guestId).then((s) => s?.score);
    const policyDecision = await canConfirmBooking({
      bookingId: "", listingId, region,
      fraudScore: guestFraudScore,
    });
    if (!policyDecision.allowed) {
      return Response.json(
        { error: policyDecision.reasonCode ?? "Booking not allowed by policy" },
        { status: 403 }
      );
    }
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const available = await isListingAvailable(listingId, checkInDate, checkOutDate);
    if (!available) {
      return Response.json(
        { error: "Listing not available for selected dates" },
        { status: 400 }
      );
    }
    const booking = await createBooking({
      listingId,
      guestId,
      checkIn,
      checkOut,
      guestNotes,
    });
    void recordPlatformEvent({
      eventType: "booking_created",
      entityType: "BOOKING",
      entityId: booking.id,
      payload: { listingId, guestId, status: booking.status },
      region,
    });
    return Response.json(booking);
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Failed to create booking" },
      { status: 400 }
    );
  }
}
