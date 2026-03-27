/**
 * GET /api/bnhub/bookings/[id]/status — minimal booking/payment state for polling after checkout.
 * Allowed: booking guest, listing host, or ADMIN.
 */

import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { id: bookingId } = await context.params;
  const userId = await getGuestId();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      status: true,
      confirmationCode: true,
      guestId: true,
      payment: { select: { status: true } },
      listing: { select: { ownerId: true } },
    },
  });
  if (!booking) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const me = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  const allowed =
    me?.role === "ADMIN" || booking.guestId === userId || booking.listing.ownerId === userId;
  if (!allowed) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  return Response.json({
    bookingStatus: booking.status,
    paymentStatus: booking.payment?.status ?? null,
    confirmationCode: booking.confirmationCode,
  });
}
