import { BookingStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireMobileUser } from "@/lib/mobile/mobileAuth";

export const dynamic = "force-dynamic";

function bnhubLifecyclePhase(b: {
  status: BookingStatus;
  checkedInAt: Date | null;
  checkedOutAt: Date | null;
  payment: { status: string } | null;
}): string {
  if (b.status === BookingStatus.DISPUTED) return "disputed";
  if (b.status === BookingStatus.COMPLETED) return "completed";
  if (b.checkedOutAt) return "checked_out";
  if (b.checkedInAt) return "checked_in";
  if (b.status === BookingStatus.CONFIRMED && b.payment?.status === "COMPLETED") return "paid";
  if (b.status === BookingStatus.PENDING && b.payment?.status === "PENDING") return "pending_payment";
  if (b.status === BookingStatus.AWAITING_HOST_APPROVAL) return "awaiting_host";
  return b.status.toLowerCase();
}

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
            stripePaymentId: true,
            stripeCheckoutSessionId: true,
            scheduledHostPayoutAt: true,
            hostPayoutReleasedAt: true,
          },
        },
        review: { select: { id: true } },
      },
    });
    if (!b) return Response.json({ error: "Not found" }, { status: 404 });

    const checklistCount = await prisma.bnhubBookingChecklistItem.count({ where: { bookingId: b.id } });

    const pay = b.payment;
    const totalPaid = pay?.amountCents ?? b.totalCents + b.guestFeeCents;
    const pastCheckout = new Date() >= b.checkOut;
    const reviewEligible =
      b.status === BookingStatus.COMPLETED && pastCheckout && !b.review;
    const paidLike =
      b.status === BookingStatus.CONFIRMED || b.status === BookingStatus.COMPLETED
        ? pay?.status === "COMPLETED"
        : false;

    return Response.json({
      booking: {
        id: b.id,
        confirmationCode: b.confirmationCode,
        checkIn: b.checkIn.toISOString(),
        checkOut: b.checkOut.toISOString(),
        nights: b.nights,
        status: b.status,
        checkedInAt: b.checkedInAt?.toISOString() ?? null,
        checkedOutAt: b.checkedOutAt?.toISOString() ?? null,
        lifecyclePhase: bnhubLifecyclePhase({
          status: b.status,
          checkedInAt: b.checkedInAt,
          checkedOutAt: b.checkedOutAt,
          payment: pay,
        }),
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
          stripePaymentIntentId: pay?.stripePaymentId ?? null,
          stripeCheckoutSessionId: pay?.stripeCheckoutSessionId ?? null,
          scheduledHostPayoutAt: pay?.scheduledHostPayoutAt?.toISOString() ?? null,
          hostPayoutReleasedAt: pay?.hostPayoutReleasedAt?.toISOString() ?? null,
        },
        checklist: {
          available: Boolean(paidLike),
          itemCount: checklistCount,
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
