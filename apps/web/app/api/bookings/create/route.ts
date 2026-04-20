import { NextRequest } from "next/server";
import { ListingStatus } from "@prisma/client";
import { createBooking } from "@/lib/bnhub/booking";
import {
  logBnhubBookingCreate,
  precheckBnhubBookingAvailability,
  validateBnhubBookingDateStrings,
  validateBnhubListingStructureForBooking,
} from "@/lib/bnhub/booking-create-validation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/modules/security/access-guard.service";
import { logApiRouteError } from "@/lib/api/dev-log";
import { GuestIdentityRequiredError } from "@/lib/bnhub/guest-identity-gate";
import { computeBookingPricing } from "@/lib/bnhub/booking-pricing";
import { maybeBlockRequestWithLegalGate } from "@/modules/legal/legal-api-gate";
import { syncAvailability } from "@/modules/channel-manager/channel-sync.service";

export const dynamic = "force-dynamic";

/**
 * POST /api/bookings/create — validate + create pending (or awaiting host) booking.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser();
    if (!auth.ok) return auth.response;
    const guestId = auth.userId;

    const body = (await request.json()) as {
      listingId?: string;
      checkIn?: string;
      checkOut?: string;
      guestsCount?: number;
      guestEmail?: string;
      guestName?: string;
      guestPhone?: string;
      guestNotes?: string;
      specialRequest?: string;
      specialRequestsJson?: Record<string, unknown> | null;
    };

    const listingId = typeof body.listingId === "string" ? body.listingId.trim() : "";
    const checkIn = typeof body.checkIn === "string" ? body.checkIn.trim() : "";
    const checkOut = typeof body.checkOut === "string" ? body.checkOut.trim() : "";
    if (!listingId || !checkIn || !checkOut) {
      logBnhubBookingCreate({ phase: "reject", reason: "missing_fields", listingId: listingId || null });
      return Response.json({ error: "listingId, checkIn, and checkOut are required." }, { status: 400 });
    }

    const dateVal = validateBnhubBookingDateStrings(checkIn, checkOut);
    if (!dateVal.ok) {
      logBnhubBookingCreate({ phase: "reject", reason: "date_validation", detail: dateVal.error, listingId });
      return Response.json({ error: dateVal.error }, { status: 400 });
    }

    const checkInD = new Date(checkIn);
    const checkOutD = new Date(checkOut);

    const listing = await prisma.shortTermListing.findUnique({
      where: { id: listingId },
      select: {
        id: true,
        title: true,
        description: true,
        nightPriceCents: true,
        maxGuests: true,
        photos: true,
        amenities: true,
        listingStatus: true,
        listingPhotos: { select: { id: true } },
      },
    });
    if (!listing) {
      logBnhubBookingCreate({ phase: "reject", reason: "listing_not_found", listingId });
      return Response.json({ error: "Listing not found." }, { status: 404 });
    }

    if (listing.listingStatus === ListingStatus.PUBLISHED) {
      const struct = validateBnhubListingStructureForBooking(listing);
      if (!struct.ok) {
        logBnhubBookingCreate({
          phase: "reject",
          reason: "listing_structure",
          listingId,
          errors: struct.errors,
        });
        return Response.json(
          { error: struct.errors[0] ?? "Listing does not meet booking requirements.", errors: struct.errors },
          { status: 400 },
        );
      }
    }

    const legalGate = await maybeBlockRequestWithLegalGate({
      action: "start_booking",
      userId: guestId,
      actorType: "buyer",
    });
    if (legalGate) return legalGate;

    const availability = await precheckBnhubBookingAvailability(listingId, checkInD, checkOutD);
    if (!availability.available) {
      logBnhubBookingCreate({
        phase: "reject",
        reason: availability.reason,
        listingId,
        checkIn,
        checkOut,
      });
      return Response.json(
        { error: "Selected dates are no longer available.", code: availability.reason },
        { status: 409 },
      );
    }

    const guestsCount =
      typeof body.guestsCount === "number" && body.guestsCount > 0
        ? Math.min(50, Math.max(1, Math.floor(body.guestsCount)))
        : undefined;

    const pricingCheck = await computeBookingPricing({
      listingId,
      checkIn,
      checkOut,
      guestCount: guestsCount,
      guestUserId: guestId,
    });
    if (!pricingCheck) {
      logBnhubBookingCreate({ phase: "reject", reason: "pricing_unavailable", listingId });
      return Response.json({ error: "Could not compute pricing for these dates." }, { status: 400 });
    }
    const b = pricingCheck.breakdown;
    logBnhubBookingCreate({
      phase: "pricing_preview",
      listingId,
      nights: b.nights,
      nightlySubtotalCents: b.subtotalCents,
      cleaningFeeCents: b.cleaningFeeCents,
      serviceFeeCents: b.serviceFeeCents,
      totalCents: b.totalCents,
      currency: b.currency,
    });

    const booking = await createBooking({
      listingId,
      guestId,
      checkIn,
      checkOut,
      guestCount: guestsCount,
      guestContactEmail: typeof body.guestEmail === "string" ? body.guestEmail : undefined,
      guestContactName: typeof body.guestName === "string" ? body.guestName : undefined,
      guestContactPhone: typeof body.guestPhone === "string" ? body.guestPhone : undefined,
      guestNotes: typeof body.guestNotes === "string" ? body.guestNotes : undefined,
      specialRequest: typeof body.specialRequest === "string" ? body.specialRequest : undefined,
      specialRequestsJson:
        body.specialRequestsJson && typeof body.specialRequestsJson === "object"
          ? body.specialRequestsJson
          : undefined,
    });

    logBnhubBookingCreate({
      phase: "created",
      bookingId: booking.id,
      listingId,
      guestId,
      status: booking.status,
      nights: booking.nights,
      confirmationCode: booking.confirmationCode,
    });

    void syncAvailability(listingId).catch((err) =>
      logApiRouteError("syncAvailability after POST /api/bookings/create", err)
    );

    const pay = await prisma.payment.findUnique({
      where: { bookingId: booking.id },
      select: { amountCents: true },
    });

    return Response.json({
      id: booking.id,
      summary: {
        status: booking.status,
        checkIn: booking.checkIn.toISOString(),
        checkOut: booking.checkOut.toISOString(),
        nights: booking.nights,
        confirmationCode: booking.confirmationCode,
        totalCents: pay?.amountCents ?? null,
        currency: "CAD",
      },
    });
  } catch (e) {
    if (e instanceof GuestIdentityRequiredError) {
      return Response.json({ error: e.message, code: e.code }, { status: 403 });
    }
    const msg = e instanceof Error ? e.message : "Booking could not be created.";
    if (
      msg.includes("Selected dates are no longer available") ||
      msg.includes("Listing not available for selected dates")
    ) {
      return Response.json({ error: "Selected dates are no longer available." }, { status: 409 });
    }
    if (msg.includes("at most") && msg.includes("guests")) {
      return Response.json({ error: msg }, { status: 400 });
    }
    if (msg.includes("not available for booking") || msg.includes("PUBLISHED")) {
      return Response.json({ error: msg }, { status: 403 });
    }
    logApiRouteError("POST /api/bookings/create", e);
    return Response.json({ error: "Booking could not be created. Try again or contact support." }, { status: 500 });
  }
}
