import { NextRequest } from "next/server";
import { cancelBooking } from "@/lib/bnhub/booking";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { logInfo } from "@/lib/logger";
import { logApiRouteError } from "@/lib/api/dev-log";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/**
 * POST /api/bookings/[id]/cancel — guest (own), host (listing owner), or admin.
 */
export async function POST(request: NextRequest, ctx: Ctx) {
  try {
    const userId = await getGuestId();
    if (!userId) {
      return Response.json({ error: "Sign in required." }, { status: 401 });
    }
    const { id: bookingId } = await ctx.params;
    if (!bookingId?.trim()) {
      return Response.json({ error: "Invalid booking id." }, { status: 400 });
    }

    const body = (await request.json().catch(() => ({}))) as { reason?: string };
    const reason = typeof body.reason === "string" ? body.reason : undefined;

    const row = await prisma.booking.findUnique({
      where: { id: bookingId.trim() },
      select: { guestId: true, listing: { select: { ownerId: true } } },
    });
    if (!row) {
      return Response.json({ error: "Booking not found." }, { status: 404 });
    }

    const admin = await isPlatformAdmin(userId);
    let by: "guest" | "host" | "admin";
    if (row.guestId === userId) by = "guest";
    else if (row.listing.ownerId === userId) by = "host";
    else if (admin) by = "admin";
    else {
      return Response.json({ error: "Not allowed to cancel this booking." }, { status: 403 });
    }

    const updated = await cancelBooking(bookingId.trim(), userId, by, { reason });
    logInfo("[booking/cancel]", { bookingId: updated.id, by, userId });

    // Financial Wiring: Record Refund if payment was already made
    if (updated.status === "CANCELLED") {
      const { processRefund } = await import("@/modules/payouts/payout.service");
      const bookingWithPayment = await prisma.booking.findUnique({
        where: { id: updated.id },
        include: { payment: true }
      });
      
      if (bookingWithPayment?.payment?.amountCents) {
        void processRefund(updated.id, bookingWithPayment.payment.amountCents).catch((err) => 
          console.error("[finance] failed to record refund on cancel", err)
        );
      }
    }

    return Response.json({
      id: updated.id,
      status: updated.status,
      canceledAt: updated.canceledAt?.toISOString() ?? null,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Cancel failed.";
    if (msg.includes("cannot be cancelled")) {
      return Response.json({ error: msg }, { status: 409 });
    }
    logApiRouteError("POST /api/bookings/[id]/cancel", e);
    return Response.json({ error: "Could not cancel booking." }, { status: 500 });
  }
}
