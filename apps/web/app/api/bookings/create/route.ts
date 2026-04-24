import { NextRequest } from "next/server";
import { ListingStatus } from "@prisma/client";
import { createBooking } from "@/lib/bnhub/booking";
import {
  logBnhubBookingCreate,
  normalizeBnhubBookingDatesToYmd,
  precheckBnhubBookingAvailability,
  validateBnhubBookingDateStrings,
  validateBnhubListingStructureForBooking,
} from "@/lib/bnhub/booking-create-validation";
import { prisma } from "@repo/db";
import { requireUser } from "@/modules/security/access-guard.service";
import { logApiRouteError } from "@/lib/api/dev-log";
import { GuestIdentityRequiredError } from "@/lib/bnhub/guest-identity-gate";
import { computeBookingPricing } from "@/lib/bnhub/booking-pricing";
import { maybeBlockRequestWithLegalGate } from "@/modules/legal/legal-api-gate";
import { syncAvailability } from "@/modules/channel-manager/channel-sync.service";
import { jsonErr, jsonOk } from "@/lib/api/standard-json";
import { recordEvolutionOutcome } from "@/modules/evolution/outcome-tracker.service";

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
      return jsonErr("listingId, checkIn, and checkOut are required.", 400, "MISSING_FIELDS");
    }

    const dateVal = validateBnhubBookingDateStrings(checkIn, checkOut);
    if (!dateVal.ok) {
      logBnhubBookingCreate({ phase: "reject", reason: "date_validation", detail: dateVal.error, listingId });
      return jsonErr(dateVal.error, 400, "INVALID_DATES");
    }

    const ymd = normalizeBnhubBookingDatesToYmd(checkIn, checkOut);
    const checkInNorm = ymd?.checkInYmd ?? checkIn;
    const checkOutNorm = ymd?.checkOutYmd ?? checkOut;

    const checkInD = new Date(checkInNorm);
    const checkOutD = new Date(checkOutNorm);

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
      return jsonErr("Listing not found.", 404, "NOT_FOUND");
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
          {
            success: false,
            error: struct.errors[0] ?? "Listing does not meet booking requirements.",
            code: "LISTING_STRUCTURE",
            errors: struct.errors,
          },
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
        {
          success: false,
          error: "Selected dates are no longer available.",
          code: availability.reason ?? "DATES_UNAVAILABLE",
        },
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

    void recordEvolutionOutcome({
      domain: "BOOKING",
      metricType: "BOOKING",
      strategyKey: "booking_conversion",
      entityId: booking.id,
      entityType: "Booking",
      actualJson: {
        listingId,
        nights: booking.nights,
        status: booking.status,
      },
      reinforceStrategy: true,
      idempotent: true,
    }).catch(() => {});

    // Step 2: Pricing outcome wiring — check if dynamic pricing was used recently for this listing
    void (async () => {
      try {
        const lastPricing = await prisma.bnhubPricingExecutionLog.findFirst({
          where: { listingId, status: "success" },
          orderBy: { createdAt: "desc" },
          take: 1,
        });

        if (lastPricing) {
          await recordEvolutionOutcome({
            domain: "BNHUB",
            metricType: "PRICING",
            strategyKey: "dynamic_pricing",
            entityId: booking.id, // Tie it to the booking as the outcome
            entityType: "Booking",
            actualJson: {
              listingId,
              bookingId: booking.id,
              suggestedPrice: lastPricing.newPrice,
              actualPrice: lastPricing.newPrice, // Booking used the applied price
              bookingResult: "SUCCESS",
            },
            reinforceStrategy: true,
            idempotent: true,
          });
        }

        // Step 3: Conversion funnel wiring — check if user had saved this listing
        if (guestId) {
          const saved = await prisma.buyerSavedListing.findUnique({
            where: { userId_fsboListingId: { userId: guestId, fsboListingId: listingId } },
          });
          if (saved) {
            await recordEvolutionOutcome({
              domain: "BNHUB",
              metricType: "CONVERSION",
              strategyKey: "save_to_booking",
              entityId: booking.id,
              entityType: "Booking",
              actualJson: {
                listingId,
                userId: guestId,
                savedAt: saved.createdAt,
              },
              reinforceStrategy: true,
              idempotent: true,
            });
          }
        }
      } catch (err) {
        // Log failures only, never block
        console.error("[evolution:pricing] failed to record booking outcome for pricing", err);
      }
    })();

    const pay = await prisma.payment.findUnique({
      where: { bookingId: booking.id },
      select: { amountCents: true },
    });

    return jsonOk({
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
      return jsonErr(e.message, 403, e.code);
    }
    const msg = e instanceof Error ? e.message : "Booking could not be created.";
    if (
      msg.includes("Selected dates are no longer available") ||
      msg.includes("Listing not available for selected dates")
    ) {
      return jsonErr("Selected dates are no longer available.", 409, "DATES_UNAVAILABLE");
    }
    if (msg.includes("at most") && msg.includes("guests")) {
      return jsonErr(msg, 400, "GUEST_COUNT");
    }
    if (msg.includes("not available for booking") || msg.includes("PUBLISHED")) {
      return jsonErr(msg, 403, "LISTING_UNAVAILABLE");
    }
    logApiRouteError("POST /api/bookings/create", e);
    return jsonErr("Booking could not be created. Try again or contact support.", 500, "INTERNAL");
  }
}
