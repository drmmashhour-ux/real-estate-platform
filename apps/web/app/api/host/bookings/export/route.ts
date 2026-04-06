import { getGuestId } from "@/lib/auth/session";
import { getHostBookings } from "@/lib/host/bookings-data";

export const dynamic = "force-dynamic";

function csvCell(s: string) {
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/**
 * GET /api/host/bookings/export — CSV of host's bookings (auth required).
 */
export async function GET() {
  const hostId = await getGuestId();
  if (!hostId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const rows = await getHostBookings(hostId, { tab: "all" });
  const header = [
    "booking_id",
    "confirmation_code",
    "guest_name",
    "guest_email",
    "property",
    "check_in",
    "check_out",
    "nights",
    "guests",
    "booking_status",
    "payment_status",
    "total_cents",
  ].join(",");

  const lines = [header];
  for (const r of rows) {
    lines.push(
      [
        csvCell(r.id),
        csvCell(r.confirmationCode ?? ""),
        csvCell(r.guestName),
        csvCell(r.guestEmail ?? ""),
        csvCell(r.propertyTitle),
        csvCell(r.checkIn.toISOString().slice(0, 10)),
        csvCell(r.checkOut.toISOString().slice(0, 10)),
        String(r.nights),
        String(r.guestsCount ?? ""),
        csvCell(r.bookingStatus),
        csvCell(r.paymentStatus ?? ""),
        String(r.totalCents ?? ""),
      ].join(",")
    );
  }

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="lecipm-host-bookings.csv"',
    },
  });
}
