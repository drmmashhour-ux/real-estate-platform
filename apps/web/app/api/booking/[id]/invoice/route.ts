import { getGuestId } from "@/lib/auth/session";
import {
  assertBookingInvoiceAccess,
  bookingToInvoiceJson,
  redactBnhubInvoiceForGuest,
} from "@/lib/bnhub/booking-invoice";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/booking/[id]/invoice — BNHub invoice payload (JSON).
 * Guest viewers receive total paid only; platform fee / host payout are omitted (internal settlement).
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id: bookingId } = await context.params;
  const userId = await getGuestId();
  const gate = await assertBookingInvoiceAccess(bookingId, userId);
  if (!gate.ok) {
    return Response.json({ error: gate.error }, { status: gate.status });
  }
  if (gate.booking.payment?.status !== "COMPLETED") {
    return Response.json(
      { error: "Invoice is available after payment completes." },
      { status: 409 }
    );
  }

  const raw = bookingToInvoiceJson(gate.booking);
  const viewerId = userId!;
  const dbUser = await prisma.user.findUnique({
    where: { id: viewerId },
    select: { role: true },
  });
  const isAdmin = dbUser?.role === "ADMIN";
  const isHost = gate.booking.listing.ownerId === viewerId;
  const isGuest = gate.booking.guestId === viewerId;
  const showSettlement = isAdmin || isHost;

  const j = isGuest && !showSettlement ? redactBnhubInvoiceForGuest(raw) : raw;

  const base = {
    bookingId: j.bookingId,
    invoiceNumber: j.invoiceNumber,
    confirmationCode: j.confirmationCode,
    guestName: j.guestName,
    listingTitle: j.listingTitle,
    checkIn: j.checkIn,
    checkOut: j.checkOut,
    nights: j.nights,
    totalAmount: j.totalAmountCents / 100,
    paymentStatus: j.paymentStatus,
    date: j.date,
    stripeSessionId: j.stripeSessionId,
    paymentIntentId: j.paymentIntentId,
  };

  if (showSettlement) {
    return Response.json({
      ...base,
      platformFee: (j.platformFeeCents ?? 0) / 100,
      hostPayout: (j.hostPayoutCents ?? 0) / 100,
    });
  }

  return Response.json(base);
}
