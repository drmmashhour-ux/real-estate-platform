import Link from "next/link";
import { redirect } from "next/navigation";
import { SearchEventType } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { getBookingById } from "@/lib/bnhub/booking";
import { PaymentStatus } from "@prisma/client";
import { trackSearchEvent } from "@/lib/ai/search/trackSearchEvent";
import { BookingCompletedBeacon } from "@/components/analytics/BookingCompletedBeacon";
import { ContentPerformanceConversionBeacon } from "@/components/content-machine/ContentPerformanceConversionBeacon";
import { BookingSuccessNextSteps, BookingSuccessRecommendedRow } from "@/components/bnhub/BookingSuccessRetention";
import { BnhubBookingCompletedConversionBeacon } from "@/components/bnhub/BnhubBookingCompletedConversionBeacon";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function BookingSuccessPage({ searchParams }: Props) {
  const sp = await searchParams;
  const raw = sp.booking_id;
  const bookingId = typeof raw === "string" ? raw.trim() : Array.isArray(raw) ? raw[0]?.trim() ?? "" : "";
  if (!bookingId) {
    redirect("/bnhub/stays");
  }

  const userId = await getGuestId();
  if (!userId) {
    redirect(`/auth/login?next=${encodeURIComponent(`/bnhub/booking-success?booking_id=${bookingId}`)}`);
  }

  const booking = await getBookingById(bookingId);
  if (!booking || booking.guestId !== userId) {
    redirect("/bnhub/stays");
  }

  const paid = booking.payment?.status === PaymentStatus.COMPLETED;
  if (paid) {
    void trackSearchEvent({
      eventType: SearchEventType.BOOK,
      userId,
      listingId: booking.listingId,
      metadata: { bookingId: booking.id },
    });
  }
  const title = paid ? "Booking confirmed" : "Payment received — confirming…";
  const amountCents = booking.payment?.amountCents;
  const totalCad =
    amountCents != null
      ? (amountCents / 100).toLocaleString("en-CA", { style: "currency", currency: "CAD" })
      : "—";
  const nights = Math.max(1, booking.nights);
  const perNightCad =
    amountCents != null
      ? (amountCents / nights / 100).toLocaleString("en-CA", { style: "currency", currency: "CAD" })
      : "—";

  return (
    <main className="mx-auto min-h-[60vh] max-w-3xl px-4 py-16 text-slate-900">
      <BookingCompletedBeacon
        bookingId={booking.id}
        paymentConfirmed={paid}
        listingId={booking.listingId}
        valueCents={booking.payment?.amountCents ?? null}
      />
      {paid ? (
        <BnhubBookingCompletedConversionBeacon listingId={booking.listingId} paymentConfirmed={paid} />
      ) : null}
      {paid ? (
        <ContentPerformanceConversionBeacon listingId={booking.listingId} paymentConfirmed={paid} />
      ) : null}
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-800">{title}</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Booking summary</h1>
        <p className="mt-1 text-sm text-slate-600">{booking.listing.title}</p>
        <ul className="mt-6 space-y-2 text-sm text-slate-700">
          <li>
            <span className="font-medium text-slate-500">Dates</span>{" "}
            {booking.checkIn.toISOString().slice(0, 10)} → {booking.checkOut.toISOString().slice(0, 10)}
          </li>
          {booking.guestsCount != null ? (
            <li>
              <span className="font-medium text-slate-500">Guests</span> {booking.guestsCount}
            </li>
          ) : null}
          <li>
            <span className="font-medium text-slate-500">Price per night (avg.)</span> {perNightCad}
          </li>
          <li>
            <span className="font-medium text-slate-500">Nights</span> {nights}
          </li>
          <li>
            <span className="font-medium text-slate-500">Amount charged</span> {totalCad}
          </li>
          {booking.confirmationCode ? (
            <li>
              <span className="font-medium text-slate-500">Reference</span>{" "}
              <code className="rounded bg-white px-2 py-0.5 text-slate-900">{booking.confirmationCode}</code>
            </li>
          ) : null}
        </ul>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href={`/bnhub/booking/${booking.id}`}
            className="inline-flex flex-1 items-center justify-center rounded-xl bg-emerald-600 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-emerald-500"
          >
            View my booking
          </Link>
          <Link
            href="/bnhub/trips"
            className="inline-flex flex-1 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            Trips
          </Link>
          <Link
            href="/bnhub/stays"
            className="inline-flex flex-1 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            Find another stay
          </Link>
        </div>
        {!paid ? (
          <p className="mt-4 text-xs text-slate-600">
            If status doesn&apos;t update within a minute, open your booking — the webhook may still be processing.
          </p>
        ) : null}
      </div>

      <BookingSuccessNextSteps
        bookingId={booking.id}
        listingTitle={booking.listing.title}
        paid={paid}
      />
      <BookingSuccessRecommendedRow userId={userId} bookedListingId={booking.listingId} />
    </main>
  );
}
