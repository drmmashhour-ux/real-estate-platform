import { z } from "zod";

import { getGuestId } from "@/lib/auth/session";
import { getCancellationPolicy, isMarketplaceStayCompletedOrPast } from "@/lib/marketplace/cancellation-policy";
import { getMarketplaceTotalPaidCentsForBooking } from "@/lib/marketplace/payment-ledger";
import { tryRefundMarketplacePaymentAmount } from "@/lib/marketplace/refund-marketplace-booking";
import { marketplacePrisma } from "@/lib/db";
import { logInfo, logWarn } from "@/lib/logger";
import { trackEvent } from "@/src/services/analytics";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  bookingId: z.string().min(1),
});

/**
 * POST /api/bookings/cancel — marketplace `bookings` only (not BNHub monolith `Booking`).
 * Order 59.1: policy-based partial refunds, idempotent cancel, refund status, validation before Stripe.
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
    return Response.json({
      ok: true,
      idempotent: true,
      cancelledAt: booking.cancelledAt?.toISOString() ?? null,
      refundStatus: booking.refundStatus ?? "none",
      refundAmountCents: booking.refundedAmountCents ?? 0,
    });
  }

  if (booking.status === "expired") {
    return Response.json({ error: "Booking has expired" }, { status: 400 });
  }

  if (isMarketplaceStayCompletedOrPast(booking)) {
    return Response.json({ error: "This stay has already ended" }, { status: 400 });
  }

  const now = new Date();
  const pi = booking.stripePaymentIntentId?.trim() ?? "";
  const isPaidHold = booking.status === "confirmed" && pi.length > 0;

  if (!isPaidHold) {
    await marketplacePrisma.booking.update({
      where: { id: bookingId },
      data: {
        cancelledAt: now,
        status: "cancelled",
        refundStatus: "none",
      },
    });
    return Response.json({
      ok: true,
      cancelledAt: now.toISOString(),
      refund: null,
      refundAmountCents: 0,
      refundStatus: "none",
      policy: null,
    });
  }

  const totalPaidCents =
    booking.finalCents != null && booking.finalCents > 0
      ? booking.finalCents
      : (await getMarketplaceTotalPaidCentsForBooking(bookingId)) ?? 0;
  if (totalPaidCents <= 0) {
    logWarn("[bookings/cancel] confirmed without ledger row — cancelling without refund", { bookingId });
    await marketplacePrisma.booking.update({
      where: { id: bookingId },
      data: {
        cancelledAt: now,
        status: "cancelled",
        refundStatus: "none",
      },
    });
    return Response.json({
      ok: true,
      cancelledAt: now.toISOString(),
      refund: null,
      refundAmountCents: 0,
      refundStatus: "none",
      policy: { reason: "No payment on file for refund." },
    });
  }

  const policy = getCancellationPolicy(
    {
      startDate: booking.startDate,
      endDate: booking.endDate,
      status: booking.status,
      totalPaidCents,
    },
    now
  );

  const alreadyRefunded = Math.max(0, booking.refundedAmountCents ?? 0);
  if (policy.refundPercent === 0 || policy.refundableAmount === 0) {
    await marketplacePrisma.booking.update({
      where: { id: bookingId },
      data: {
        cancelledAt: now,
        status: "cancelled",
        refundStatus: "none",
      },
    });
    return Response.json({
      ok: true,
      cancelledAt: now.toISOString(),
      refund: null,
      refundAmountCents: 0,
      refundStatus: "none",
      policy: { type: policy.type, refundPercent: policy.refundPercent, reason: policy.reason },
    });
  }

  if (alreadyRefunded >= totalPaidCents) {
    await marketplacePrisma.booking.update({
      where: { id: bookingId },
      data: { cancelledAt: now, status: "cancelled", refundStatus: "completed" },
    });
    return Response.json({
      ok: true,
      cancelledAt: now.toISOString(),
      refund: { skipped: true, reason: "already_fully_refunded" },
      refundAmountCents: 0,
      refundStatus: "completed",
    });
  }

  if (!pi.startsWith("pi_")) {
    await marketplacePrisma.booking.update({
      where: { id: bookingId },
      data: { cancelledAt: now, status: "cancelled", refundStatus: "failed" },
    });
    return Response.json(
      {
        ok: true,
        cancelledAt: now.toISOString(),
        refund: { ok: false, reason: "invalid_payment_intent" },
        refundStatus: "failed",
      },
      { status: 200 }
    );
  }

  const refundCents = Math.min(policy.refundableAmount, totalPaidCents - alreadyRefunded);
  if (refundCents <= 0) {
    await marketplacePrisma.booking.update({
      where: { id: bookingId },
      data: { cancelledAt: now, status: "cancelled", refundStatus: "none" },
    });
    return Response.json({
      ok: true,
      cancelledAt: now.toISOString(),
      refund: null,
      refundAmountCents: 0,
      refundStatus: "none",
    });
  }

  void trackEvent("refund_requested", { bookingId, amount: refundCents }).catch(() => {});

  await marketplacePrisma.booking.update({
    where: { id: bookingId },
    data: { cancelledAt: now, status: "cancelled", refundStatus: "pending" },
  });

  let refund:
    | { ok: true; refundId: string; amountCents: number }
    | { ok: false; reason: string }
    | null = null;
  try {
    refund = await tryRefundMarketplacePaymentAmount(pi, refundCents, {
      alreadyRefundedCents: alreadyRefunded,
      maxTotalCents: totalPaidCents,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    logInfo("[bookings/cancel] refund threw (mark failed)", { bookingId, err: msg });
    refund = { ok: false, reason: msg };
  }

  if (refund?.ok) {
    const newTotal = alreadyRefunded + refund.amountCents;
    await marketplacePrisma.booking.update({
      where: { id: bookingId },
      data: {
        refundStatus: "completed",
        refundedAmountCents: newTotal,
      },
    });
    logInfo("[bookings/cancel] refund completed", { bookingId, refundId: refund.refundId, amountCents: refund.amountCents });
    return Response.json({
      ok: true,
      cancelledAt: now.toISOString(),
      refund: { ok: true, refundId: refund.refundId, amountCents: refund.amountCents },
      refundAmountCents: refund.amountCents,
      refundStatus: "completed",
      policy: { type: policy.type, refundPercent: policy.refundPercent, reason: policy.reason },
    });
  }

  const reason = refund && !refund.ok ? refund.reason : "refund_failed";
  await marketplacePrisma.booking.update({
    where: { id: bookingId },
    data: { refundStatus: "failed" },
  });
  logInfo("[bookings/cancel] refund failed (cancel still applied)", { bookingId, reason });

  return Response.json({
    ok: true,
    cancelledAt: now.toISOString(),
    refund: { ok: false, reason },
    refundAmountCents: 0,
    refundStatus: "failed",
    policy: { type: policy.type, refundPercent: policy.refundPercent, reason: policy.reason },
  });
}
