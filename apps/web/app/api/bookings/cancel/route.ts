import { z } from "zod";

import { getGuestId } from "@/lib/auth/session";
import { tryRefundMarketplacePayment } from "@/lib/marketplace/refund-marketplace-booking";
import { marketplacePrisma } from "@/lib/db";
import { logInfo } from "@/lib/logger";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  bookingId: z.string().min(1),
});

/**
 * POST /api/bookings/cancel — marketplace `bookings` only (not BNHub monolith `Booking`).
 * Body: `{ bookingId }`. Guest must own the row; cancels + optional Stripe refund.
 */
export async function POST(req: Request) {
  const userId = await getGuestId();
  if (!userId) {
    return Response.json({ error: "Sign in required" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
  }

  const bookingId = parsed.data.bookingId.trim();
  const booking = await marketplacePrisma.booking.findUnique({ where: { id: bookingId } });

  if (!booking) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  if (booking.userId !== userId) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  if (booking.status === "cancelled") {
    return Response.json({ error: "Already cancelled" }, { status: 409 });
  }
  if (booking.status === "expired") {
    return Response.json({ error: "Booking already expired" }, { status: 409 });
  }

  const now = new Date();
  await marketplacePrisma.booking.update({
    where: { id: bookingId },
    data: {
      cancelledAt: now,
      status: "cancelled",
    },
  });

  // Unpaid hold: no payment to refund, inventory released.
  if (booking.status === "pending" || !booking.stripePaymentIntentId?.trim()) {
    return Response.json({ ok: true, cancelledAt: now.toISOString(), refund: null });
  }

  let refund: { ok: true; refundId: string } | { ok: false; reason: string } | null = null;
  if (booking.stripePaymentIntentId?.trim()) {
    try {
      refund = await tryRefundMarketplacePayment(booking.stripePaymentIntentId);
    } catch (e) {
      logInfo("[bookings/cancel] refund failed (booking still cancelled)", {
        bookingId,
        err: e instanceof Error ? e.message : String(e),
      });
      refund = { ok: false, reason: e instanceof Error ? e.message : String(e) };
    }
  }

  return Response.json({
    ok: true,
    cancelledAt: now.toISOString(),
    refund,
  });
}
