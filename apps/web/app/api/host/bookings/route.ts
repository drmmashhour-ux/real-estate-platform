import { getGuestId } from "@/lib/auth/session";
import { getBookingsForHost } from "@/lib/bnhub/booking";
import { requireBnhubHostAccess } from "@/lib/host/require-bnhub-host-access";

export const dynamic = "force-dynamic";

function serializeBooking(b: Awaited<ReturnType<typeof getBookingsForHost>>[number]) {
  const guestTotalCents = b.totalCents + b.guestFeeCents;
  return {
    id: b.id,
    bookingCode: b.bookingCode ?? null,
    confirmationCode: b.confirmationCode ?? null,
    listingId: b.listingId,
    listing: b.listing,
    checkIn: b.checkIn.toISOString(),
    checkOut: b.checkOut.toISOString(),
    nights: b.nights,
    status: b.status,
    totalCents: b.totalCents,
    guestFeeCents: b.guestFeeCents,
    guestTotalCents,
    guestContactName: b.guestContactName ?? null,
    guest: {
      id: b.guest.id,
      name: b.guest.name,
      email: b.guest.email,
      homeCity: b.guest.homeCity,
      homeRegion: b.guest.homeRegion,
      homeCountry: b.guest.homeCountry,
    },
    payment: b.payment
      ? {
          status: b.payment.status,
          amountCents: b.payment.amountCents,
          hostPayoutCents: b.payment.hostPayoutCents,
        }
      : null,
    bnhubReservationPayment: b.bnhubReservationPayment
      ? {
          paymentStatus: b.bnhubReservationPayment.paymentStatus,
          amountCapturedCents: b.bnhubReservationPayment.amountCapturedCents,
        }
      : null,
  };
}

/**
 * GET /api/host/bookings — all bookings for host listings (upcoming vs past by checkout).
 */
export async function GET() {
  const userId = await getGuestId();
  const gate = await requireBnhubHostAccess(userId);
  if (!gate.ok) return Response.json({ error: gate.error }, { status: gate.status });

  const rows = await getBookingsForHost(gate.userId);
  const now = new Date();
  const upcoming = rows.filter((b) => b.checkOut >= now);
  const past = rows.filter((b) => b.checkOut < now);

  return Response.json({
    upcoming: upcoming.map(serializeBooking),
    past: past.map(serializeBooking),
  });
}
