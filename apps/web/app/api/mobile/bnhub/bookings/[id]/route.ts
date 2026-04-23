import { NextResponse } from "next/server";
import { getBookingById } from "@/lib/bnhub/booking";
import { requireMobileGuestUser } from "@/lib/bnhub/mobile-api";
import { prisma } from "@repo/db";

export const dynamic = "force-dynamic";

function getPrimaryListingPhoto(photos: unknown) {
  if (!Array.isArray(photos)) return null;
  const firstPhoto = photos[0];
  return typeof firstPhoto === "string" ? firstPhoto : null;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireMobileGuestUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const booking = await getBookingById(id);
  if (!booking || booking.guestId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const events = await prisma.bnhubBookingEvent.findMany({
    where: { bookingId: id },
    select: {
      id: true,
      eventType: true,
      createdAt: true,
      payload: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({
    booking: {
      id: booking.id,
      status: booking.status,
      checkIn: booking.checkIn.toISOString(),
      checkOut: booking.checkOut.toISOString(),
      nights: booking.nights,
      confirmationCode: booking.confirmationCode ?? null,
      totalCents: booking.totalCents,
      guestFeeCents: booking.guestFeeCents,
      hostFeeCents: booking.hostFeeCents,
      paymentStatus: booking.bnhubReservationPayment?.paymentStatus ?? booking.payment?.status ?? null,
      paymentReceiptUrl: booking.payment?.stripeReceiptUrl ?? null,
      invoiceId: booking.bnhubInvoice?.id ?? null,
      checkinDetails: booking.checkinDetails
        ? {
            instructions: booking.checkinDetails.instructions ?? null,
            keyInfo: booking.checkinDetails.keyInfo ?? null,
            accessType: booking.checkinDetails.accessType ?? null,
          }
        : null,
      listing: {
        id: booking.listing.id,
        title: booking.listing.title,
        city: booking.listing.city,
        listingCode: booking.listing.listingCode ?? null,
        photo: getPrimaryListingPhoto(booking.listing.photos),
      },
      services:
        booking.bnhubBookingServices?.map((service) => ({
          id: service.id,
          name: service.service.name,
          quantity: service.quantity,
          totalPriceCents: service.totalPriceCents,
          status: service.status,
        })) ?? [],
      timeline: events.map((event) => ({
        id: event.id,
        eventType: event.eventType,
        createdAt: event.createdAt.toISOString(),
        payload: event.payload,
      })),
    },
  });
}
