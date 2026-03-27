import { BookingStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireMobileUser } from "@/lib/mobile/mobileAuth";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireMobileUser(request);
    const { id } = await params;
    const b = await prisma.booking.findFirst({
      where: { id, guestId: user.id },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            city: true,
            listingCode: true,
            nightPriceCents: true,
            cleaningFeeCents: true,
            checkInTime: true,
            checkOutTime: true,
            checkInInstructions: true,
            houseRules: true,
            cancellationPolicy: true,
            photos: true,
          },
        },
        payment: {
          select: {
            amountCents: true,
            guestFeeCents: true,
            hostFeeCents: true,
            status: true,
            stripeReceiptUrl: true,
          },
        },
        review: { select: { id: true } },
      },
    });
    if (!b) return Response.json({ error: "Not found" }, { status: 404 });

    const pay = b.payment;
    const totalPaid = pay?.amountCents ?? b.totalCents + b.guestFeeCents;
    const pastCheckout = new Date() >= b.checkOut;
    const reviewEligible =
      b.status === BookingStatus.COMPLETED && pastCheckout && !b.review;

    return Response.json({
      booking: {
        id: b.id,
        confirmationCode: b.confirmationCode,
        checkIn: b.checkIn.toISOString(),
        checkOut: b.checkOut.toISOString(),
        nights: b.nights,
        status: b.status,
        specialRequest: b.specialRequest,
        refunded: b.refunded,
        listing: b.listing,
        paymentSummary: {
          nightlySubtotalCents: b.totalCents,
          cleaningFeeCents: b.listing.cleaningFeeCents,
          guestServiceFeeCents: b.guestFeeCents,
          totalChargedCents: totalPaid,
          paymentStatus: pay?.status ?? "UNKNOWN",
          receiptUrl: pay?.stripeReceiptUrl ?? null,
        },
        reviewEligible,
      },
    });
  } catch (e) {
    const err = e as Error & { status?: number };
    if (err.status === 401) return Response.json({ error: "Unauthorized" }, { status: 401 });
    throw e;
  }
}
