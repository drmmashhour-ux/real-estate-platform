import { prisma } from "@/lib/db";
import { MAX_BOOKINGS_PER_GUEST_PER_DAY, POINTS } from "@/lib/fraud/rules";
import { recordFraudSignal } from "@/lib/fraud/record-signal";

export type BookingFraudContext = {
  bookingId: string;
  guestId: string;
  listingId: string;
};

/** Runs after a booking row is created (signals only — no automatic cancellation here). */
export async function evaluateBookingFraudAfterCreate(ctx: BookingFraudContext): Promise<void> {
  const guest = await prisma.user.findUnique({
    where: { id: ctx.guestId },
    select: { id: true, createdAt: true },
  });
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const bookingCount = await prisma.booking.count({
    where: { guestId: ctx.guestId, createdAt: { gte: dayAgo } },
  });
  if (bookingCount > MAX_BOOKINGS_PER_GUEST_PER_DAY) {
    await recordFraudSignal({
      entityType: "booking",
      entityId: ctx.bookingId,
      signalType: "booking_velocity_guest",
      riskPoints: POINTS.booking_velocity_guest,
      metadataJson: { bookings24h: bookingCount },
    });
  }

  if (guest) {
    const ageMs = Date.now() - guest.createdAt.getTime();
    if (ageMs < 2 * 60 * 60 * 1000) {
      await recordFraudSignal({
        entityType: "booking",
        entityId: ctx.bookingId,
        signalType: "new_account_booking_rush",
        riskPoints: POINTS.booking_new_account_rush,
        metadataJson: { accountAgeMs: ageMs },
      });
    }
  }

}
