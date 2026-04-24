import { BookingStatus, PaymentStatus, VerificationStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { logBusinessMilestone, trackEvent } from "@/src/services/analytics";
import { persistLaunchEvent } from "@/src/modules/launch/persistLaunchEvent";

export async function getListingById(listingId: string) {
  return prisma.shortTermListing.findUnique({
    where: { id: listingId },
    include: {
      reviews: true,
      owner: { select: { id: true, emailVerifiedAt: true } },
    },
  });
}

export async function getBookingById(bookingId: string) {
  return prisma.booking.findUnique({ where: { id: bookingId } });
}

export async function getBookingWithHost(bookingId: string) {
  return prisma.booking.findUnique({
    where: { id: bookingId },
    select: { id: true, listing: { select: { ownerId: true } } },
  });
}

export async function findOverlappingBookings(listingId: string, checkIn: Date, checkOut: Date) {
  return prisma.booking.findMany({
    where: {
      listingId,
      status: {
        in: [BookingStatus.PENDING, BookingStatus.AWAITING_HOST_APPROVAL, BookingStatus.CONFIRMED, BookingStatus.COMPLETED],
      },
      AND: [{ checkIn: { lt: checkOut } }, { checkOut: { gt: checkIn } }],
    },
    select: { id: true },
  });
}

export async function createBookingRow(args: {
  listingId: string;
  guestId: string;
  checkIn: Date;
  checkOut: Date;
  nights: number;
  totalCents: number;
}) {
  const row = await prisma.$transaction(async (tx) => {
    const booking = await tx.booking.create({
      data: {
        listingId: args.listingId,
        guestId: args.guestId,
        checkIn: args.checkIn,
        checkOut: args.checkOut,
        nights: args.nights,
        totalCents: args.totalCents,
        priceSnapshotSubtotalCents: args.totalCents,
        priceSnapshotFeesCents: 0,
        priceSnapshotTaxesCents: 0,
        priceSnapshotTotalCents: args.totalCents,
        status: BookingStatus.PENDING,
      },
    });
    await tx.payment.create({
      data: {
        bookingId: booking.id,
        amountCents: args.totalCents,
        guestFeeCents: 0,
        hostFeeCents: 0,
        status: PaymentStatus.PENDING,
      },
    });
    return booking;
  });
  void trackEvent(
    "booking_started",
    {
      bookingId: row.id,
      listingId: args.listingId,
      nights: args.nights,
      totalCents: args.totalCents,
    },
    { userId: args.guestId }
  );
  logBusinessMilestone("BOOKING CREATED", { bookingId: row.id, listingId: args.listingId });
  void persistLaunchEvent("CREATE_BOOKING", {
    bookingId: row.id,
    listingId: args.listingId,
    guestId: args.guestId,
    nights: args.nights,
    totalCents: args.totalCents,
  });
  void import("@/lib/growth/events").then(({ recordGrowthEventWithFunnel }) =>
    recordGrowthEventWithFunnel("booking_start", {
      userId: args.guestId,
      metadata: { bookingId: row.id, listingId: args.listingId, nights: args.nights },
    })
  );
  return row;
}

export async function updateBookingStatus(bookingId: string, status: BookingStatus) {
  return prisma.booking.update({
    where: { id: bookingId },
    data: { status },
  });
}

export async function updateListingVerification(listingId: string, status: VerificationStatus) {
  return prisma.shortTermListing.update({
    where: { id: listingId },
    data: { verificationStatus: status },
  });
}

export async function verifyUserIdentity(userId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { emailVerifiedAt: new Date() },
    select: { id: true, emailVerifiedAt: true },
  });
}

export async function getBookedRanges(listingId: string) {
  return prisma.booking.findMany({
    where: {
      listingId,
      status: { in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED, BookingStatus.PENDING, BookingStatus.AWAITING_HOST_APPROVAL] },
    },
    select: { checkIn: true, checkOut: true },
    orderBy: { checkIn: "asc" },
  });
}

export async function createEscrowPayoutHold(bookingId: string, hostId: string) {
  const existing = await prisma.payoutHold.findFirst({
    where: { bookingId, status: "ON_HOLD" },
  });
  if (existing) return existing;
  return prisma.payoutHold.create({
    data: {
      bookingId,
      hostId,
      reason: "escrow_window",
      status: "ON_HOLD",
    },
  });
}

export async function releaseEscrowPayoutHold(bookingId: string) {
  return prisma.payoutHold.updateMany({
    where: { bookingId, status: "ON_HOLD" },
    data: { status: "RELEASED", releasedAt: new Date() },
  });
}

