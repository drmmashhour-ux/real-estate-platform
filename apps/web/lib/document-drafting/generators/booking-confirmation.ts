import { prisma } from "@/lib/db";
import { renderTemplate } from "../engine";
import { validateContext, REQUIRED_BY_DOCUMENT_TYPE } from "../validators";
import { BOOKING_CONFIRMATION_TEMPLATE } from "../templates/booking-confirmation";

function formatDate(d: Date): string {
  return new Date(d).toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" });
}
function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);
}

export async function generateBookingConfirmationDraft(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      guest: { select: { id: true, name: true, email: true } },
      listing: {
        select: {
          id: true,
          title: true,
          address: true,
          city: true,
          cleaningFeeCents: true,
          ownerId: true,
        },
      },
      payment: true,
    },
  });
  if (!booking) throw new Error("Booking not found");
  const host = booking.listing?.ownerId
    ? await prisma.user.findUnique({
        where: { id: booking.listing.ownerId },
        select: { name: true, email: true },
      })
    : null;
  const address = [booking.listing?.address, booking.listing?.city].filter(Boolean).join(", ") || "—";
  const guestTotalCents =
    booking.totalCents + (booking.guestFeeCents ?? 0);
  const context: Record<string, unknown> = {
    booking_id: booking.id,
    listing_title: booking.listing?.title ?? "—",
    property_address: address,
    guest_name: booking.guest.name ?? booking.guest.email ?? "—",
    guest_email: booking.guest.email ?? "—",
    host_name: host?.name ?? host?.email ?? "—",
    host_email: host?.email ?? "",
    booking_start_date: formatDate(booking.checkIn),
    booking_end_date: formatDate(booking.checkOut),
    nights: booking.nights,
    subtotal: formatCents(booking.totalCents),
    cleaning_fee: booking.listing?.cleaningFeeCents
      ? formatCents(booking.listing.cleaningFeeCents)
      : "",
    service_fee: formatCents(booking.guestFeeCents ?? 0),
    total_amount: formatCents(guestTotalCents),
    generated_date: formatDate(new Date()),
  };
  const validation = validateContext(context, REQUIRED_BY_DOCUMENT_TYPE.booking_confirmation);
  if (!validation.valid) throw new Error(`Missing required fields: ${validation.missing.join(", ")}`);
  const html = renderTemplate(BOOKING_CONFIRMATION_TEMPLATE, context);
  return {
    html,
    context,
    signatureFields: [
      { signerRole: "guest", signerName: String(context.guest_name), signerEmail: String(context.guest_email) },
      { signerRole: "host", signerName: String(context.host_name), signerEmail: String(context.host_email || "") },
    ],
  };
}
