import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { createBooking } from "@/lib/bnhub/booking";
import { isListingAvailable } from "@/lib/bnhub/listings";
import { requireMobileUser } from "@/lib/mobile/mobileAuth";
import { logApiRouteError } from "@/lib/api/dev-log";
import { GuestIdentityRequiredError } from "@/lib/bnhub/guest-identity-gate";

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

export async function POST(request: Request) {
  try {
    const user = await requireMobileUser(request);
    const body = (await request.json().catch(() => ({}))) as {
      listingId?: string;
      checkIn?: string;
      checkOut?: string;
      guestNotes?: string;
    };
    const listingId = typeof body.listingId === "string" ? body.listingId.trim() : "";
    const checkIn = typeof body.checkIn === "string" ? body.checkIn.trim() : "";
    const checkOut = typeof body.checkOut === "string" ? body.checkOut.trim() : "";
    if (!listingId || !checkIn || !checkOut) {
      return Response.json({ error: "listingId, checkIn, checkOut required" }, { status: 400 });
    }
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const available = await isListingAvailable(listingId, checkInDate, checkOutDate);
    if (!available) {
      return Response.json({ error: "Listing not available for selected dates" }, { status: 400 });
    }
    const booking = await createBooking({
      listingId,
      guestId: user.id,
      checkIn,
      checkOut,
      guestNotes: typeof body.guestNotes === "string" ? body.guestNotes : undefined,
    });
    return Response.json({ booking: { id: booking.id, status: booking.status } });
  } catch (e) {
    if (e instanceof GuestIdentityRequiredError) {
      return Response.json({ error: e.message, code: e.code }, { status: 403 });
    }
    const err = e as Error & { status?: number };
    if (err.status === 401) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const msg = e instanceof Error ? e.message : "Booking could not be created";
    if (msg.includes("Guest acknowledgment") || msg.includes("agreement")) {
      return Response.json({ error: msg, code: "GUEST_ACK_OR_CONTRACT" }, { status: 403 });
    }
    logApiRouteError("POST /api/mobile/v1/bookings", e);
    return Response.json({ error: msg }, { status: 400 });
  }
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
