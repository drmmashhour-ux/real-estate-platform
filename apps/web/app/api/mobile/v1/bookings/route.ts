import { prisma } from "@/lib/db";
import { requireMobileUser } from "@/lib/mobile/mobileAuth";

export const dynamic = "force-dynamic";

function bookingMobileDto(b: {
  id: string;
  confirmationCode: string | null;
  checkIn: Date;
  checkOut: Date;
  nights: number;
  totalCents: number;
  guestFeeCents: number;
  status: string;
  refunded: boolean;
  listing: { id: string; title: string; city: string; listingCode: string; nightPriceCents: number; cleaningFeeCents: number };
  payment: {
    amountCents: number;
    guestFeeCents: number;
    status: string;
    stripeReceiptUrl: string | null;
  } | null;
}) {
  const pay = b.payment;
  const totalPaid = pay?.amountCents ?? b.totalCents + b.guestFeeCents;
  return {
    id: b.id,
    confirmationCode: b.confirmationCode,
    checkIn: b.checkIn.toISOString(),
    checkOut: b.checkOut.toISOString(),
    nights: b.nights,
    status: b.status,
    refunded: b.refunded,
    listing: {
      id: b.listing.id,
      title: b.listing.title,
      city: b.listing.city,
      listingCode: b.listing.listingCode,
    },
    paymentSummary: {
      nightlySubtotalCents: b.totalCents,
      cleaningFeeCents: b.listing.cleaningFeeCents,
      guestServiceFeeCents: b.guestFeeCents,
      totalChargedCents: totalPaid,
      paymentStatus: pay?.status ?? "UNKNOWN",
      receiptUrl: pay?.stripeReceiptUrl ?? null,
    },
  };
}

export async function GET(request: Request) {
  try {
    const user = await requireMobileUser(request);
    const bookings = await prisma.booking.findMany({
      where: { guestId: user.id },
      orderBy: { checkIn: "desc" },
      take: 50,
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
          },
        },
        payment: {
          select: {
            amountCents: true,
            guestFeeCents: true,
            status: true,
            stripeReceiptUrl: true,
          },
        },
      },
    });
    return Response.json({ bookings: bookings.map(bookingMobileDto) });
  } catch (e) {
    const err = e as Error & { status?: number };
    if (err.status === 401) return Response.json({ error: "Unauthorized" }, { status: 401 });
    throw e;
  }
}
