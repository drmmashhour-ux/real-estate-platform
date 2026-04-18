import { NextRequest } from "next/server";
import { createBooking } from "@/lib/bnhub/booking";
import { isListingAvailable } from "@/lib/bnhub/listings";
import { requireUser } from "@/modules/security/access-guard.service";
import { prisma } from "@/lib/db";
import { isBookingRestrictedFor } from "@/lib/operational-controls";
import { canConfirmBooking } from "@/lib/policy-engine";
import { recordPlatformEvent } from "@/lib/observability";
import { getFraudScore } from "@/lib/ai-fraud";
import { isUserRestricted } from "@/lib/defense/abuse-prevention";
import { sendBookingConfirmation } from "@/lib/email/send";
import { assertGuestShortTermBookingAllowed } from "@/modules/legal/assert-legal";
import { bookingGuestAckEnforced } from "@/lib/legal/booking-guest-ack";
import { logImmoContactEvent } from "@/lib/immo/immo-contact-log";
import { ImmoContactEventType } from "@prisma/client";
import { hasActiveEnforceableContract } from "@/lib/legal/enforceable-contract";
import { ENFORCEABLE_CONTRACT_TYPES } from "@/lib/legal/enforceable-contract-types";
import { enforceableContractsRequired } from "@/lib/legal/enforceable-contracts-enforcement";
import { requireContentLicenseAccepted } from "@/lib/legal/content-license-enforcement";
import { logApiRouteError } from "@/lib/api/dev-log";
import { logInfo } from "@/lib/logger";
import { GuestIdentityRequiredError } from "@/lib/bnhub/guest-identity-gate";
import { GrowthEventName } from "@/modules/growth/event-types";
import { trackGrowthSystemEvent } from "@/modules/growth/tracking.service";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser();
    if (!auth.ok) return auth.response;
    const guestId = auth.userId;
    const licenseBlock = await requireContentLicenseAccepted(guestId);
    if (licenseBlock) return licenseBlock;
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
    const {
      listingId,
      checkIn,
      checkOut,
      guestNotes,
      specialRequest,
      specialRequestsJson,
      guestCount,
      selectedAddons,
    } = body as {
      listingId?: string;
      checkIn?: string;
      checkOut?: string;
      guestNotes?: string;
      specialRequest?: string;
      specialRequestsJson?: Record<string, unknown> | null;
      guestCount?: number;
      selectedAddons?: { listingServiceId: string; quantity: number }[];
    };
    if (!listingId || !checkIn || !checkOut) {
      return Response.json(
        { error: "listingId, checkIn, checkOut required" },
        { status: 400 }
      );
    }
    const listingMeta = await prisma.shortTermListing.findUnique({
      where: { id: listingId },
      select: { city: true, title: true, listingStatus: true, owner: { select: { accountStatus: true } } },
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

    if (bookingGuestAckEnforced()) {
      const guestLegal = await assertGuestShortTermBookingAllowed(guestId, listingId);
      if (!guestLegal.ok) {
        return Response.json(
          {
            error: guestLegal.blockingReasons[0] ?? "Guest acknowledgment required before booking",
            code: "GUEST_ACK_REQUIRED",
            missing: guestLegal.missing.map((m) => m.key),
          },
          { status: 403 }
        );
      }
    }

    if (enforceableContractsRequired()) {
      const signed = await hasActiveEnforceableContract(guestId, ENFORCEABLE_CONTRACT_TYPES.SHORT_TERM, {
        listingId,
      });
      if (!signed) {
        return Response.json(
          {
            error:
              "Sign the short-term stay agreement for this listing before booking (ContractSign kind=shortTerm with listing id).",
            code: "ENFORCEABLE_CONTRACT_REQUIRED",
          },
          { status: 403 }
        );
      }
    }

    const booking = await createBooking({
      listingId,
      guestId,
      checkIn,
      checkOut,
      guestCount:
        typeof guestCount === "number" && guestCount > 0
          ? Math.min(50, Math.max(1, Math.floor(guestCount)))
          : undefined,
      selectedAddons: Array.isArray(selectedAddons)
        ? selectedAddons
            .filter(
              (x) =>
                x &&
                typeof x.listingServiceId === "string" &&
                typeof x.quantity === "number" &&
                x.quantity > 0
            )
            .map((x) => ({
              listingServiceId: x.listingServiceId,
              quantity: Math.min(99, Math.max(1, Math.floor(x.quantity))),
            }))
        : undefined,
      guestNotes,
      specialRequest: typeof specialRequest === "string" ? specialRequest : undefined,
      specialRequestsJson:
        specialRequestsJson && typeof specialRequestsJson === "object" ? specialRequestsJson : undefined,
    });
    logInfo("[booking] created", {
      bookingId: booking.id,
      listingId,
      guestId,
      status: booking.status,
    });
    void import("@/modules/fraud/fraud-engine.service")
      .then((m) =>
        m.evaluateLaunchFraudEngine(
          { user: { id: guestId }, booking: { id: booking.id } },
          { persist: true, actionType: "booking_created_v1" }
        )
      )
      .catch((e) => logInfo("[launch-fraud] booking eval failed", { message: String(e) }));
    void import("@/lib/listings/listing-analytics-service").then((m) =>
      m.incrementBnhubBookingAttempt(listingId)
    );
    void recordPlatformEvent({
      eventType: "booking_created",
      entityType: "BOOKING",
      entityId: booking.id,
      payload: { listingId, guestId, status: booking.status },
      region,
    });
    void trackGrowthSystemEvent(
      GrowthEventName.BOOKING_STARTED,
      { listingId, bookingId: booking.id, surface: "bnhub_booking_create" },
      {
        userId: guestId,
        idempotencyKey: `booking_started:${booking.id}`,
        cookieHeader: request.headers.get("cookie"),
        body,
        pageUrl: request.url,
        referrerHeader: request.headers.get("referer"),
      },
    );
    void logImmoContactEvent({
      userId: guestId,
      listingId,
      listingKind: "bnhub",
      contactType: ImmoContactEventType.BOOKING_REQUEST,
      metadata: { bookingId: booking.id },
      policy: {
        sourceHub: "bnhub_guest",
        channel: "booking_request",
        semantic: "booking_created",
        bookingId: booking.id,
      },
    });
    const guest = await prisma.user.findUnique({ where: { id: guestId }, select: { email: true } }).catch(() => null);
    if (guest?.email) {
      sendBookingConfirmation(
        guest.email,
        booking.id,
        listingMeta?.title ?? "Your booking",
        String(checkIn),
        String(checkOut)
      ).catch(() => {});
    }
    return Response.json(booking);
  } catch (e) {
    if (e instanceof GuestIdentityRequiredError) {
      return Response.json({ error: e.message, code: e.code }, { status: 403 });
    }
    logApiRouteError("POST /api/bnhub/bookings", e);
    return Response.json(
      { error: "Booking could not be created. Try again or contact support." },
      { status: 500 }
    );
  }
}
