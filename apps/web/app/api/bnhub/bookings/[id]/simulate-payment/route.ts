import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { confirmBooking } from "@/lib/bnhub/booking";
import { isStripeConfigured } from "@/lib/stripe";

export const dynamic = "force-dynamic";

/**
 * POST — Demo-only: confirm a pending BNHUB booking without Stripe (when Stripe is not configured).
 */
export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (isStripeConfigured()) {
    return Response.json(
      { error: "Simulated payment is disabled when Stripe is configured. Use checkout." },
      { status: 403 }
    );
  }

  const { id: bookingId } = await params;
  const userId = await getGuestId();
  if (!userId) {
    return Response.json({ error: "Sign in required" }, { status: 401 });
  }

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: { guestId: true, status: true },
    });
    if (!booking) {
      return Response.json({ error: "Booking not found" }, { status: 404 });
    }
    if (booking.guestId !== userId) {
      return Response.json({ error: "Not your booking" }, { status: 403 });
    }
    if (booking.status !== "PENDING") {
      return Response.json(
        { error: "Booking is not awaiting payment. Approve the request first if required." },
        { status: 400 }
      );
    }

    await confirmBooking(bookingId);
    return Response.json({ ok: true, simulated: true, bookingId });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    return Response.json({ error: msg }, { status: 400 });
  }
}
