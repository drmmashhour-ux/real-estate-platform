/**
 * Mobile-friendly JSON — same rules as guest web summary.
 */

import { prisma } from "@/lib/db";
import { requireMobileUser } from "@/lib/mobile/mobileAuth";
import { getGuestPaymentSummary } from "@/modules/bnhub-payments/services/paymentService";
import { getRefundSummary } from "@/modules/bnhub-payments/services/refundService";

export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const bookingId = (await context.params).id;
  let userId: string;
  try {
    userId = (await requireMobileUser(request)).id;
  } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { guestId: true, status: true, confirmationCode: true },
  });
  if (!booking || booking.guestId !== userId) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const mp = await getGuestPaymentSummary(userId, bookingId);
  const refunds = await getRefundSummary(userId, bookingId);

  return Response.json({
    bookingId,
    bookingStatus: booking.status,
    confirmationCode: booking.confirmationCode,
    payment: mp,
    refunds,
  });
}
