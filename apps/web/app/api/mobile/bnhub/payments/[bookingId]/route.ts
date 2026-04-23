import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { requireMobileGuestUser } from "@/lib/bnhub/mobile-api";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ bookingId: string }> }) {
  const user = await requireMobileGuestUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { bookingId } = await params;
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      guestId: true,
      totalCents: true,
      guestFeeCents: true,
      payment: {
        select: {
          status: true,
          amountCents: true,
          guestFeeCents: true,
          hostFeeCents: true,
          stripeReceiptUrl: true,
          stripeCheckoutAmountCents: true,
        },
      },
      bnhubReservationPayment: {
        select: {
          paymentStatus: true,
          amountCapturedCents: true,
          amountRefundedCents: true,
        },
      },
    },
  });

  if (!booking || booking.guestId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    payment: {
      bookingId: booking.id,
      bookingTotalCents: booking.totalCents,
      bookingGuestFeeCents: booking.guestFeeCents,
      legacyStatus: booking.payment?.status ?? null,
      status: booking.bnhubReservationPayment?.paymentStatus ?? booking.payment?.status ?? null,
      amountCents: booking.payment?.amountCents ?? null,
      guestFeeCents: booking.payment?.guestFeeCents ?? null,
      hostFeeCents: booking.payment?.hostFeeCents ?? null,
      stripeCheckoutAmountCents: booking.payment?.stripeCheckoutAmountCents ?? null,
      receiptUrl: booking.payment?.stripeReceiptUrl ?? null,
      amountCapturedCents: booking.bnhubReservationPayment?.amountCapturedCents ?? null,
      amountRefundedCents: booking.bnhubReservationPayment?.amountRefundedCents ?? null,
    },
  });
}
