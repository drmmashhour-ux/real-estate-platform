/**
 * GET — guest-only financial summary for a booking (marketplace payment + quote lines).
 */

import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { getGuestPaymentSummary } from "@/modules/bnhub-payments/services/paymentService";
import { getRefundSummary } from "@/modules/bnhub-payments/services/refundService";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, context: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = await context.params;
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      guestId: true,
      confirmationCode: true,
      status: true,
      payment: {
        select: {
          amountCents: true,
          status: true,
          stripeReceiptUrl: true,
        },
      },
    },
  });
  if (!booking || booking.guestId !== userId) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const mp = await getGuestPaymentSummary(userId, bookingId);
  const refunds = await getRefundSummary(userId, bookingId);

  return Response.json({
    bookingId,
    confirmationCode: booking.confirmationCode,
    bookingStatus: booking.status,
    legacyPayment: booking.payment,
    marketplace: mp,
    refunds: refunds.map((r) => ({
      id: r.id,
      amountCents: r.amountCents,
      currency: r.currency,
      refundStatus: r.refundStatus,
      refundType: r.refundType,
      reasonCode: r.reasonCode,
    })),
    wording: {
      payoutNote:
        "Funds may be released to the host on a delayed schedule per booking status and risk review. This is payout control, not legal escrow unless separately contracted.",
    },
  });
}
