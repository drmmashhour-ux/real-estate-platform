import { NextRequest } from "next/server";
import { getBookingById } from "@/lib/bnhub/booking";
import { prisma } from "@/lib/db";
import { recordPlatformEvent } from "@/lib/observability";
import { recordRevenueEntry } from "@/lib/revenue-intelligence";

/** POST /api/bnhub/bookings/[id]/pay — Confirm payment (mock). Sets booking CONFIRMED, payment COMPLETED. */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const booking = await getBookingById(id);
    if (!booking) return Response.json({ error: "Not found" }, { status: 404 });
    if (booking.status !== "PENDING") {
      return Response.json(
        { error: "Booking is not pending payment" },
        { status: 400 }
      );
    }
    if (booking.payment?.status !== "PENDING") {
      return Response.json(
        { error: "Payment already processed" },
        { status: 400 }
      );
    }

    await prisma.$transaction([
      prisma.booking.update({
        where: { id },
        data: { status: "CONFIRMED" },
      }),
      prisma.payment.updateMany({
        where: { bookingId: id },
        data: { status: "COMPLETED" },
      }),
    ]);

    const updated = await getBookingById(id);
    const region = updated?.listing?.city;
    const payment = updated?.payment;
    void recordPlatformEvent({
      eventType: "payment_completed",
      entityType: "PAYMENT",
      entityId: id,
      payload: { bookingId: id, status: "COMPLETED" },
      region,
    });
    if (payment && (payment.guestFeeCents > 0 || payment.hostFeeCents > 0)) {
      void recordRevenueEntry({
        type: "BOOKING_COMMISSION",
        entityType: "BOOKING",
        entityId: id,
        amountCents: payment.guestFeeCents + payment.hostFeeCents,
        module: "BNHUB",
        metadata: { guestFeeCents: payment.guestFeeCents, hostFeeCents: payment.hostFeeCents, region },
      });
    }
    return Response.json(updated);
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: "Failed to confirm payment" },
      { status: 500 }
    );
  }
}
