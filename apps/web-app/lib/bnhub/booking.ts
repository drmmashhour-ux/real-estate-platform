import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { computeBookingPricing } from "./booking-pricing";
import { triggerNewBooking, triggerBookingConfirmation, triggerBookingCancellation, triggerReviewReminder } from "./notifications";
import { ESCROW_RELEASE_HOURS_AFTER_CHECKIN } from "@/lib/trust-safety/constants";

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
  guestNotes?: string;
}) {
  const checkIn = new Date(data.checkIn);
  const checkOut = new Date(data.checkOut);
  const nights = Math.ceil(
    (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (nights < 1) throw new Error("Invalid dates");

  const listing = await prisma.shortTermListing.findUniqueOrThrow({
    where: { id: data.listingId },
    include: { owner: { select: { accountStatus: true } } },
  });
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

  const pricing = await computeBookingPricing({
    listingId: data.listingId,
    checkIn: data.checkIn,
    checkOut: data.checkOut,
  });
  if (!pricing) throw new Error("Could not compute pricing");
  const b = pricing.breakdown;

  const initialStatus = listing.instantBookEnabled ? "PENDING" : "AWAITING_HOST_APPROVAL";

  const booking = await prisma.booking.create({
    data: {
      listingId: data.listingId,
      guestId: data.guestId,
      checkIn,
      checkOut,
      nights,
      totalCents: b.subtotalCents,
      guestFeeCents: b.serviceFeeCents,
      hostFeeCents: b.hostFeeCents,
      status: initialStatus,
      guestNotes: data.guestNotes,
    },
  });

  const escrowReleaseAt = new Date(checkIn.getTime() + ESCROW_RELEASE_HOURS_AFTER_CHECKIN * 60 * 60 * 1000);
  await prisma.payment.create({
    data: {
      bookingId: booking.id,
      amountCents: b.totalCents,
      guestFeeCents: b.serviceFeeCents,
      hostFeeCents: b.hostFeeCents,
      hostPayoutCents: b.hostPayoutCents,
      status: "PENDING",
      hostPayoutReleasedAt: escrowReleaseAt,
      payoutHoldReason: "escrow_window",
    },
  });

  await recordBookingEvent(
    booking.id,
    initialStatus === "PENDING" ? "created" : "awaiting_host_approval",
    data.guestId,
    { nights: b.nights, totalCents: b.totalCents }
  );

  void triggerNewBooking({
    bookingId: booking.id,
    listingId: data.listingId,
    guestId: data.guestId,
    hostId: listing.ownerId,
  });

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
  void triggerBookingConfirmation({
    bookingId,
    guestId: updated.guestId,
    hostId: updated.listing.ownerId,
  });
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
  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: { status: "DECLINED" },
    include: { listing: true, guest: true, payment: true },
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
  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: { status: newStatus },
    include: { listing: true, guest: true, payment: true },
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
    },
  });
}
