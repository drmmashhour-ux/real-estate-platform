import { BookingStatus, BnhubDayAvailabilityStatus } from "@prisma/client";
import type { AvailabilityResult } from "@/src/modules/bnhub/domain/types";
import {
  createBookingRow,
  findOverlappingBookings,
  getBookedRanges,
  getBookingById,
  getListingById,
  updateBookingStatus,
} from "@/src/modules/bnhub/infrastructure/bnhubRepository";
import { utcDayStart } from "@/lib/bnhub/availability-day-helpers";
import { prisma } from "@/lib/db";
import { computeReservationQuoteFromBooking } from "@/modules/bnhub-payments/services/paymentQuoteService";
import { onGrowthAiCheckoutCompleted } from "@/src/modules/messaging/triggers";
import { holdPaymentInEscrow, releasePaymentAfterStay } from "@/src/modules/bnhub/application/paymentService";
import { generateListingTrustScore } from "@/src/modules/bnhub/application/trustService";

function toDate(value: string): Date {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) throw new Error("Invalid date");
  return d;
}

function nightsBetween(checkIn: Date, checkOut: Date): number {
  const ms = checkOut.getTime() - checkIn.getTime();
  return Math.ceil(ms / 86400000);
}

export function calculateBookingTotalCents(args: {
  nights: number;
  pricePerNightCents: number;
  cleaningFeeCents: number;
  depositCents: number;
}): number {
  return args.nights * args.pricePerNightCents + args.cleaningFeeCents + args.depositCents;
}

export async function createBooking(args: {
  listingId: string;
  userId: string;
  startDate: string;
  endDate: string;
}) {
  const checkIn = toDate(args.startDate);
  const checkOut = toDate(args.endDate);
  if (checkOut <= checkIn) throw new Error("End date must be after start date");
  const nights = nightsBetween(checkIn, checkOut);
  if (nights < 1) throw new Error("Minimum stay is 1 night");

  const listing = await getListingById(args.listingId);
  if (!listing) throw new Error("Listing not found");
  if (listing.verificationStatus !== "VERIFIED") {
    throw new Error("Listing must be verified before booking");
  }
  const trust = await generateListingTrustScore(args.listingId);
  if (trust.score < 35) {
    throw new Error("Listing flagged for manual trust review");
  }

  const overlaps = await findOverlappingBookings(args.listingId, checkIn, checkOut);
  if (overlaps.length > 0) throw new Error("Selected dates are not available");

  const rangeStart = utcDayStart(checkIn);
  const rangeEnd = utcDayStart(checkOut);
  const blockedSlot = await prisma.availabilitySlot.findFirst({
    where: {
      listingId: args.listingId,
      date: { gte: rangeStart, lt: rangeEnd },
      OR: [
        { available: false },
        { dayStatus: { in: [BnhubDayAvailabilityStatus.BLOCKED, BnhubDayAvailabilityStatus.BOOKED] } },
      ],
    },
  });
  if (blockedSlot) throw new Error("Selected dates are not available (calendar blocked)");

  const totalCents = calculateBookingTotalCents({
    nights,
    pricePerNightCents: listing.nightPriceCents,
    cleaningFeeCents: listing.cleaningFeeCents,
    depositCents: listing.securityDepositCents,
  });

  const row = await createBookingRow({
    listingId: args.listingId,
    guestId: args.userId,
    checkIn,
    checkOut,
    nights,
    totalCents,
  });

  const quote = await computeReservationQuoteFromBooking(row.id);
  if (quote.ok) {
    await prisma.payment.updateMany({
      where: { bookingId: row.id },
      data: {
        amountCents: quote.grandTotalCents,
        guestFeeCents: quote.breakdown.serviceFeeCents,
        hostFeeCents: quote.breakdown.hostFeeCents,
      },
    });
  }

  return row;
}

export async function confirmBooking(bookingId: string) {
  const booking = await getBookingById(bookingId);
  if (!booking) throw new Error("Booking not found");
  if (booking.status === BookingStatus.CANCELLED || booking.status === BookingStatus.CANCELLED_BY_GUEST || booking.status === BookingStatus.CANCELLED_BY_HOST) {
    throw new Error("Cannot confirm a canceled booking");
  }
  const confirmed = await updateBookingStatus(bookingId, BookingStatus.CONFIRMED);
  await holdPaymentInEscrow(bookingId);
  void onGrowthAiCheckoutCompleted(booking.guestId).catch(() => {});
  return confirmed;
}

export async function cancelBooking(bookingId: string) {
  const booking = await getBookingById(bookingId);
  if (!booking) throw new Error("Booking not found");
  if (booking.status === BookingStatus.COMPLETED) {
    throw new Error("Cannot cancel a completed booking");
  }
  return updateBookingStatus(bookingId, BookingStatus.CANCELLED_BY_GUEST);
}

export async function completeBookingStay(bookingId: string) {
  const booking = await getBookingById(bookingId);
  if (!booking) throw new Error("Booking not found");
  if (booking.status !== BookingStatus.CONFIRMED) {
    throw new Error("Only confirmed bookings can be completed");
  }
  const completed = await updateBookingStatus(bookingId, BookingStatus.COMPLETED);
  await releasePaymentAfterStay(bookingId);
  const snap = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      guestId: true,
      totalCents: true,
      guestFeeCents: true,
      hostFeeCents: true,
      listingId: true,
    },
  });
  if (snap) {
    void import("@/src/modules/revenue/revenueEngine")
      .then(({ recordBookingCompletedRevenue }) =>
        recordBookingCompletedRevenue({
          guestUserId: snap.guestId,
          bookingId,
          totalCents: snap.totalCents,
          guestFeeCents: snap.guestFeeCents,
          hostFeeCents: snap.hostFeeCents,
          listingId: snap.listingId,
        })
      )
      .catch(() => {});
  }
  return completed;
}

export async function getAvailability(listingId: string): Promise<AvailabilityResult> {
  const ranges = await getBookedRanges(listingId);
  const booked: string[] = [];
  ranges.forEach((r) => {
    const d = new Date(r.checkIn);
    while (d < r.checkOut) {
      booked.push(d.toISOString().slice(0, 10));
      d.setUTCDate(d.getUTCDate() + 1);
    }
  });

  const next30: string[] = [];
  const start = new Date();
  for (let i = 0; i < 30; i++) {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    next30.push(d.toISOString().slice(0, 10));
  }
  const bookedSet = new Set(booked);
  return {
    bookedDates: Array.from(bookedSet).sort(),
    availableDates: next30.filter((d) => !bookedSet.has(d)),
  };
}

