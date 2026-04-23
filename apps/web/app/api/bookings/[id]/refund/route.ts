import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { refundBnhubBookingPayment } from "@/lib/stripe/refundBnhubBookingPayment";
import { logInfo } from "@/lib/logger";
import { logApiRouteError } from "@/lib/api/dev-log";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/**
 * POST /api/bookings/[id]/refund — host (listing owner) or platform admin only.
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

    const row = await prisma.booking.findUnique({
      where: { id: bookingId.trim() },
      select: { listing: { select: { ownerId: true } } },
    });
    if (!row) {
      return Response.json({ error: "Booking not found." }, { status: 404 });
    }

    const admin = await isPlatformAdmin(userId);
    if (row.listing.ownerId !== userId && !admin) {
      return Response.json({ error: "Only the host or an admin can issue a refund." }, { status: 403 });
    }

    const body = (await request.json().catch(() => ({}))) as {
      amount?: number;
      reason?: string;
    };
    const amountCents =
      typeof body.amount === "number" && body.amount > 0 ? Math.round(body.amount * 100) : undefined;
    const reason = typeof body.reason === "string" ? body.reason : undefined;

    const result = await refundBnhubBookingPayment({
      bookingId: bookingId.trim(),
      amountCents,
      reason,
    });
    if (!result.ok) {
      return Response.json({ error: result.error }, { status: result.httpStatus });
    }

    logInfo("[booking/refund]", {
      bookingId: bookingId.trim(),
      refundId: result.refundId,
      actorUserId: userId,
    });

    return Response.json({
      refundId: result.refundId,
      paymentStatus: result.status,
      bookingStatus: result.bookingStatus ?? null,
    });
  } catch (e) {
    logApiRouteError("POST /api/bookings/[id]/refund", e);
    return Response.json({ error: "Refund could not be processed." }, { status: 500 });
  }
}
