import { prisma } from "@/lib/db";
import { trackSyriaGrowthEvent } from "@/lib/growth-events";
import { revalidateSyriaPaths } from "@/lib/revalidate-locale";
import { assertSybnbPaymentCompleteAsync } from "./payment-policy";
import { appendSyriaSybnbCoreAudit } from "./sybnb-financial-audit";
import { isAllowedSybnbStayStatusTransition } from "./sybnb-state-machine";

export type SybnbCheckoutApplyError =
  | { status: 404; code: "not_found" }
  | { status: 409; code: "invalid_state" }
  | { status: 409; code: "invalid_transition" }
  | {
      status: 403;
      code: "payment_gated";
      reason: string;
      detail: string;
      riskCodes: string[];
    };

/**
 * Confirms a stay booking after a successful payment signal (webhook or authorized API).
 * Idempotent: returns error if not in APPROVED+UNPAID.
 */
export async function applySybnbCheckoutComplete(
  bookingId: string,
  options?: { growthEventSource?: string },
): Promise<{ ok: true } | { ok: false; error: SybnbCheckoutApplyError }> {
  const id = bookingId.trim();
  if (!id) {
    return { ok: false, error: { status: 404, code: "not_found" } };
  }

  const booking = await prisma.syriaBooking.findUnique({
    where: { id },
    include: { property: { include: { owner: true } } },
  });
  if (!booking || booking.property.category !== "stay") {
    return { ok: false, error: { status: 404, code: "not_found" } };
  }
  if (booking.status !== "APPROVED" || booking.guestPaymentStatus !== "UNPAID") {
    return { ok: false, error: { status: 409, code: "invalid_state" } };
  }
  if (!isAllowedSybnbStayStatusTransition(booking.status, "CONFIRMED")) {
    return { ok: false, error: { status: 409, code: "invalid_transition" } };
  }
  const payGate = await assertSybnbPaymentCompleteAsync(
    booking.property,
    booking.property.owner,
    booking,
    booking.guestId,
  );
  if (!payGate.ok) {
    await appendSyriaSybnbCoreAudit({
      bookingId: booking.id,
      event: "checkout_payment_blocked",
      metadata: {
        reasonCode: payGate.reason,
        riskCodes: payGate.riskCodes ?? [],
      },
    });
    return {
      ok: false,
      error: {
        status: 403,
        code: "payment_gated",
        reason: payGate.reason,
        detail: payGate.detail,
        riskCodes: payGate.riskCodes ?? [],
      },
    };
  }

  await prisma.syriaBooking.update({
    where: { id: booking.id },
    data: {
      status: "CONFIRMED",
      guestPaymentStatus: "PAID",
    },
  });

  await appendSyriaSybnbCoreAudit({
    bookingId: booking.id,
    event: "checkout_webhook_paid",
    metadata: { guestPaymentStatus: "PAID", priorStatus: "APPROVED" },
  });

  await trackSyriaGrowthEvent({
    eventType: "sybnb_checkout_webhook_paid",
    userId: booking.guestId,
    propertyId: booking.propertyId,
    bookingId: booking.id,
    payload: { source: options?.growthEventSource ?? "sybnb_checkout" },
  });

  await revalidateSyriaPaths("/dashboard/bookings", "/admin/bookings", "/sybnb", `/listing/${booking.propertyId}`);

  return { ok: true };
}
