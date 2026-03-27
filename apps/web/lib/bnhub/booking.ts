import {
  BnhubBookingServiceLineStatus,
  BnhubBookingSource,
  BnhubServiceSelectedFrom,
  NotificationType,
  Prisma,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import { assertHostAgreementSignedForPublish } from "@/lib/contracts/bnhub-host-contracts";
import { contractEnforcementDisabled } from "@/lib/contracts/enforcement-flags";
import { allocateUniqueConfirmationCode } from "@/lib/bnhub/confirmation-code";
import { generateBookingCode } from "@/lib/codes/generate-code";
import { computeBookingPricing } from "./booking-pricing";
import type { SelectedAddonInput } from "./hospitality-addons";
import { triggerNewBooking, triggerBookingConfirmation, triggerBookingCancellation, triggerReviewReminder } from "./notifications";
import { ESCROW_RELEASE_HOURS_AFTER_CHECKIN } from "@/lib/trust-safety/constants";
import { generateBookingConfirmationDraft } from "@/lib/document-drafting/generators/booking-confirmation";
import { saveBookingAgreement } from "@/lib/agreements/platform-agreements";
import { legalEnforcementDisabled } from "@/modules/legal/legal-enforcement";
import { assertGuestShortTermBookingAllowed } from "@/modules/legal/assert-legal";
import {
  releaseBookedSlotsForBooking,
  upsertBookedNightsForBooking,
  utcDayStart,
} from "./availability-day-helpers";
import { syncTrustGraphOnBookingCreated } from "@/lib/trustgraph/application/integrations/bnHubBookingIntegration";
import { runBnhubPostBookingPaidAutomation, runBnhubStayCompletedAutomation } from "@/lib/bnhub/revenue-automation";
import { evaluateListingForNewBooking } from "@/lib/bnhub/bnhub-safety-rules";

const GUEST_FEE_PERCENT = 12;
const HOST_FEE_PERCENT = 3;

/** Legacy fee calculation (used when pricing engine not needed). */
export function calculateFees(nightPriceCents: number, nights: number) {
  const totalCents = nightPriceCents * nights;
  const guestFeeCents = Math.round((totalCents * GUEST_FEE_PERCENT) / 100);
  const hostFeeCents = Math.round((totalCents * HOST_FEE_PERCENT) / 100);
  const hostPayoutCents = totalCents - hostFeeCents;
  const guestTotalCents = totalCents + guestFeeCents;
  return {
    totalCents,
    guestFeeCents,
    hostFeeCents,
    hostPayoutCents,
    guestTotalCents,
    nights,
  };
}

async function recordBookingEvent(
  bookingId: string,
  eventType: string,
  actorId: string | null,
  payload?: Record<string, unknown>
) {
  await prisma.bnhubBookingEvent.create({
    data: {
      bookingId,
      eventType,
      actorId,
      payload: payload ? (payload as Prisma.InputJsonValue) : undefined,
    },
  });
}

/**
 * Create a booking. Uses full pricing engine (nightly, cleaning, tax, fees).
 * If listing has instantBookEnabled: status PENDING (guest pays to confirm).
 * If not: status AWAITING_HOST_APPROVAL (host must approve, then guest pays).
 */
export async function createBooking(data: {
  listingId: string;
  guestId: string;
  checkIn: string;
  checkOut: string;
  guestCount?: number;
  /** Optional hospitality add-ons (validated server-side against listing offers). */
  selectedAddons?: SelectedAddonInput[];
  guestNotes?: string;
  /** Optional guest asks (pickup, etc.) — persisted on booking; falls back to guestNotes when omitted. */
  specialRequest?: string;
  /** Structured requests (airport pickup, parking, shuttle, extras). */
  specialRequestsJson?: Record<string, unknown> | null;
}) {
  const checkIn = new Date(data.checkIn);
  const checkOut = new Date(data.checkOut);
  const nights = Math.ceil(
    (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (nights < 1) throw new Error("Invalid dates");

  const listing = await prisma.shortTermListing.findUniqueOrThrow({
    where: { id: data.listingId },
    include: { owner: { select: { id: true, accountStatus: true } } },
  });

  const fraudRow = await prisma.propertyFraudScore.findUnique({
    where: { listingId: data.listingId },
    select: { fraudScore: true, riskLevel: true },
  });
  const safety = evaluateListingForNewBooking(listing, fraudRow);
  if (!safety.ok && safety.blockReason) {
    throw new Error(safety.blockReason);
  }

  const blockedStatuses = ["UNDER_INVESTIGATION", "FROZEN", "REJECTED_FOR_FRAUD", "PERMANENTLY_REMOVED", "SUSPENDED"];
  if (listing.listingStatus && blockedStatuses.includes(listing.listingStatus)) {
    throw new Error("This listing is not available for booking");
  }
  if (listing.owner?.accountStatus && listing.owner.accountStatus !== "ACTIVE") {
    throw new Error("Bookings are not available for this listing");
  }

  if (listing.minStayNights != null && nights < listing.minStayNights) {
    throw new Error(`Minimum stay is ${listing.minStayNights} nights`);
  }
  if (listing.maxStayNights != null && nights > listing.maxStayNights) {
    throw new Error(`Maximum stay is ${listing.maxStayNights} nights`);
  }

  if (!contractEnforcementDisabled()) {
    const hostGate = await assertHostAgreementSignedForPublish(data.listingId);
    if (!hostGate.ok) {
      throw new Error(hostGate.reasons[0] ?? "Host agreement required before bookings are accepted.");
    }
  }

  if (!legalEnforcementDisabled()) {
    const guestLegal = await assertGuestShortTermBookingAllowed(data.guestId, data.listingId);
    if (!guestLegal.ok) {
      throw new Error(guestLegal.blockingReasons[0] ?? "Guest acknowledgment required before booking.");
    }
  }

  const pricing = await computeBookingPricing({
    listingId: data.listingId,
    checkIn: data.checkIn,
    checkOut: data.checkOut,
    guestCount: data.guestCount,
    selectedAddons: data.selectedAddons,
  });
  if (!pricing) throw new Error("Could not compute pricing");
  const b = pricing.breakdown;

  const initialStatus = listing.instantBookEnabled ? "PENDING" : "AWAITING_HOST_APPROVAL";
  const confirmationCode = await allocateUniqueConfirmationCode();

  const escrowReleaseAt = new Date(checkIn.getTime() + ESCROW_RELEASE_HOURS_AFTER_CHECKIN * 60 * 60 * 1000);

  const booking = await prisma.$transaction(
    async (tx) => {
      const overlapping = await tx.booking.findFirst({
        where: {
          listingId: data.listingId,
          status: { in: ["CONFIRMED", "PENDING", "AWAITING_HOST_APPROVAL"] },
          OR: [
            { checkIn: { lte: checkIn }, checkOut: { gt: checkIn } },
            { checkIn: { lt: checkOut }, checkOut: { gte: checkOut } },
            { checkIn: { gte: checkIn }, checkOut: { lte: checkOut } },
          ],
        },
      });
      if (overlapping) {
        throw new Error("Listing not available for selected dates");
      }

      const rangeStart = utcDayStart(checkIn);
      const rangeEnd = utcDayStart(checkOut);
      const blockedSlot = await tx.availabilitySlot.findFirst({
        where: {
          listingId: data.listingId,
          date: { gte: rangeStart, lt: rangeEnd },
          OR: [{ available: false }, { dayStatus: { in: ["BLOCKED", "BOOKED"] } }],
        },
      });
      if (blockedSlot) {
        throw new Error("Listing not available for selected dates");
      }

      const bookingCode = await generateBookingCode(tx);
      const created = await tx.booking.create({
        data: {
          listingId: data.listingId,
          guestId: data.guestId,
          bookingSource: BnhubBookingSource.LOCAL,
          checkIn,
          checkOut,
          nights,
          totalCents: b.subtotalCents,
          guestFeeCents: b.serviceFeeCents,
          hostFeeCents: b.hostFeeCents,
          status: initialStatus,
          guestNotes: data.guestNotes,
          specialRequest: data.specialRequest ?? data.guestNotes,
          specialRequestsJson: (data.specialRequestsJson ?? undefined) as Prisma.InputJsonValue | undefined,
          confirmationCode,
          bookingCode,
        },
      });

      await tx.payment.create({
        data: {
          bookingId: created.id,
          amountCents: b.totalCents,
          guestFeeCents: b.serviceFeeCents,
          hostFeeCents: b.hostFeeCents + b.addonsHostFeeCents,
          hostPayoutCents: b.hostPayoutCents,
          status: "PENDING",
          hostPayoutReleasedAt: escrowReleaseAt,
          payoutHoldReason: "escrow_window",
        },
      });

      for (const line of b.addonLines) {
        const lineStatus = line.quoteRequired
          ? BnhubBookingServiceLineStatus.REQUESTED
          : line.requiresApproval
            ? BnhubBookingServiceLineStatus.PENDING_APPROVAL
            : BnhubBookingServiceLineStatus.CONFIRMED;
        await tx.bnhubBookingService.create({
          data: {
            bookingId: created.id,
            listingId: data.listingId,
            guestUserId: data.guestId,
            hostUserId: listing.ownerId,
            listingServiceId: line.listingServiceId,
            serviceId: line.serviceId,
            quantity: line.quantity,
            linePricingType: line.pricingType,
            unitPriceCents: line.unitPriceCents,
            totalPriceCents: line.totalPriceCents,
            status: lineStatus,
            selectedFrom: BnhubServiceSelectedFrom.BOOKING_FLOW,
          },
        });
      }

      await upsertBookedNightsForBooking(tx, {
        listingId: data.listingId,
        checkIn,
        checkOut,
        bookingId: created.id,
      });

      return created;
    },
    {
      maxWait: 5000,
      timeout: 20000,
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    }
  );

  await recordBookingEvent(
    booking.id,
    initialStatus === "PENDING" ? "created" : "awaiting_host_approval",
    data.guestId,
    {
      nights: b.nights,
      totalCents: b.totalCents,
      addonsSubtotalCents: b.addonsSubtotalCents,
    }
  );

  void triggerNewBooking({
    bookingId: booking.id,
    listingId: data.listingId,
    guestId: data.guestId,
    hostId: listing.ownerId,
  });

  void syncTrustGraphOnBookingCreated({ bookingId: booking.id }).catch(() => {});

  // In-app notification for host (booking request / awaiting payment)
  {
    const guestName =
      (await prisma.user.findUnique({ where: { id: data.guestId }, select: { name: true } }))?.name?.trim() ??
      "Guest";
    void prisma.notification
      .create({
        data: {
          userId: listing.ownerId,
          type: NotificationType.SYSTEM,
          title: initialStatus === "PENDING" ? "New booking — payment pending" : "New booking request",
          message: `${guestName} booked “${listing.title.slice(0, 80)}”.`,
          actionUrl: `/bnhub/booking/${booking.id}`,
          actionLabel: "View reservation",
          actorId: data.guestId,
          metadata: { bookingId: booking.id, listingId: data.listingId } as object,
        },
      })
      .catch(() => {});
  }

  // Auto-generate and save booking agreement to DB
  try {
    const draft = await generateBookingConfirmationDraft(booking.id);
    await saveBookingAgreement({
      bookingId: booking.id,
      version: "1.0",
      contentHtml: draft.html,
      metadata: {
        guestId: data.guestId,
        hostId: listing.ownerId,
        listingId: data.listingId,
      },
    });
  } catch (e) {
    console.warn("[booking] Failed to generate/save booking agreement:", e);
  }

  // Unified contract record for dashboard/legal
  try {
    const { createBookingContract } = await import("@/lib/hubs/contracts");
    await createBookingContract({
      bookingId: booking.id,
      userId: data.guestId,
      listingId: data.listingId,
      hub: "bnhub",
      content: { bookingId: booking.id, checkIn: data.checkIn, checkOut: data.checkOut },
    });
  } catch (e) {
    console.warn("[booking] Failed to create booking contract record:", e);
  }

  return prisma.booking.findUniqueOrThrow({
    where: { id: booking.id },
    include: {
      listing: true,
      guest: { select: { id: true, name: true, email: true } },
      payment: true,
    },
  });
}

export async function getBookingsForGuest(guestId: string) {
  return prisma.booking.findMany({
    where: { guestId },
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          city: true,
          photos: true,
          listingPhotos: true,
          nightPriceCents: true,
          listingStatus: true,
        },
      },
      payment: true,
      review: true,
    },
    orderBy: { checkIn: "desc" },
  });
}

export async function getBookingsForHost(ownerId: string) {
  return prisma.booking.findMany({
    where: { listing: { ownerId } },
    include: {
      listing: { select: { id: true, title: true, city: true } },
      guest: { select: { id: true, name: true, email: true } },
      payment: true,
    },
    orderBy: { checkIn: "desc" },
  });
}

/** Confirm booking after payment (sets CONFIRMED, payment COMPLETED). */
export async function confirmBooking(bookingId: string) {
  const booking = await prisma.booking.findUniqueOrThrow({
    where: { id: bookingId },
    include: { payment: true },
  });
  if (booking.status !== "PENDING" && booking.status !== "AWAITING_HOST_APPROVAL") {
    throw new Error("Booking cannot be confirmed in current state");
  }
  await prisma.payment.update({
    where: { bookingId },
    data: { status: "COMPLETED" },
  });
  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: { status: "CONFIRMED" },
    include: { listing: true, guest: true, payment: true },
  });
  await recordBookingEvent(bookingId, "confirmed", null, { via: "payment" });

  try {
    const { holdPaymentInEscrow } = await import("@/src/modules/bnhub/application/paymentService");
    await holdPaymentInEscrow(bookingId);
  } catch (e) {
    console.warn("[booking] escrow hold after confirm:", e);
  }

  void triggerBookingConfirmation({
    bookingId,
    guestId: updated.guestId,
    hostId: updated.listing.ownerId,
  });

  void prisma.notification
    .create({
      data: {
        userId: updated.listing.ownerId,
        type: NotificationType.SYSTEM,
        title: "Payment received — booking confirmed",
        message: `Payment for “${updated.listing.title.slice(0, 80)}” is complete.`,
        actionUrl: `/bnhub/booking/${bookingId}`,
        actionLabel: "View booking",
        actorId: updated.guestId,
        metadata: { bookingId, listingId: updated.listingId } as object,
      },
    })
    .catch(() => {});

  void prisma.notification
    .create({
      data: {
        userId: updated.guestId,
        type: NotificationType.SYSTEM,
        title: "Booking confirmed",
        message: `Your stay at “${updated.listing.title.slice(0, 80)}” is confirmed.`,
        actionUrl: `/bnhub/booking/${bookingId}`,
        actionLabel: "View trip",
        metadata: { bookingId } as object,
      },
    })
    .catch(() => {});

  void runBnhubPostBookingPaidAutomation(bookingId).catch(() => {});

  return updated;
}

/** Host approves a booking request (guest can then pay). */
export async function approveBooking(bookingId: string, hostId: string) {
  const booking = await prisma.booking.findUniqueOrThrow({
    where: { id: bookingId },
    include: { listing: true, payment: true },
  });
  if (booking.listing.ownerId !== hostId) {
    throw new Error("Only the host can approve this booking");
  }
  if (booking.status !== "AWAITING_HOST_APPROVAL") {
    throw new Error("Booking is not awaiting host approval");
  }
  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: { status: "PENDING" },
    include: { listing: true, guest: true, payment: true },
  });
  await recordBookingEvent(bookingId, "approved", hostId);
  return updated;
}

/** Host declines a booking request. */
export async function declineBooking(bookingId: string, hostId: string, reason?: string) {
  const booking = await prisma.booking.findUniqueOrThrow({
    where: { id: bookingId },
    include: { listing: true },
  });
  if (booking.listing.ownerId !== hostId) {
    throw new Error("Only the host can decline this booking");
  }
  if (booking.status !== "AWAITING_HOST_APPROVAL") {
    throw new Error("Booking is not awaiting host approval");
  }
  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.booking.update({
      where: { id: bookingId },
      data: { status: "DECLINED" },
      include: { listing: true, guest: true, payment: true },
    });
    await releaseBookedSlotsForBooking(tx, bookingId);
    return row;
  });
  await recordBookingEvent(bookingId, "declined", hostId, { reason });
  return updated;
}

/** Cancel a booking (guest, host, or admin). */
export async function cancelBooking(
  bookingId: string,
  actorId: string,
  by: "guest" | "host" | "admin"
) {
  const booking = await prisma.booking.findUniqueOrThrow({
    where: { id: bookingId },
    include: { listing: true, payment: true },
  });
  const status = booking.status;
  if (
    ["DECLINED", "CANCELLED", "CANCELLED_BY_GUEST", "CANCELLED_BY_HOST", "COMPLETED"].includes(status)
  ) {
    throw new Error("Booking cannot be cancelled in current state");
  }
  const newStatus =
    by === "guest"
      ? "CANCELLED_BY_GUEST"
      : by === "host"
        ? "CANCELLED_BY_HOST"
        : "CANCELLED";
  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.booking.update({
      where: { id: bookingId },
      data: { status: newStatus },
      include: { listing: true, guest: true, payment: true },
    });
    await releaseBookedSlotsForBooking(tx, bookingId);
    return row;
  });
  await recordBookingEvent(bookingId, "cancelled", actorId, { by, previousStatus: status });
  void triggerBookingCancellation({
    bookingId,
    guestId: updated.guestId,
    hostId: updated.listing.ownerId,
    cancelledBy: by,
  });
  return updated;
}

export async function completeBooking(bookingId: string) {
  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: { status: "COMPLETED" },
    include: { listing: true, payment: true },
  });
  await recordBookingEvent(bookingId, "completed", null);
  void triggerReviewReminder({
    bookingId,
    guestId: updated.guestId,
    listingId: updated.listingId,
  });
  void runBnhubStayCompletedAutomation(bookingId, updated.guestId).catch(() => {});
  return updated;
}

export async function getBookingById(bookingId: string) {
  return prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      listing: true,
      guest: { select: { id: true, name: true, email: true } },
      payment: true,
      review: true,
      checkinDetails: true,
      bnhubInvoice: true,
      bnhubBookingServices: {
        include: { service: true, listingService: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });
}
