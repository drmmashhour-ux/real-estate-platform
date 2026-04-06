"use client";

import Link from "next/link";

type Booking = {
  id: string;
  checkIn: Date;
  checkOut: Date;
  nights: number;
  status: string;
  totalCents: number;
  guestFeeCents: number;
  listing: { id: string; title: string; city: string; photos: string[]; nightPriceCents: number };
  payment: { status: string } | null;
  bnhubReservationPayment:
    | {
        paymentStatus: string;
        amountCapturedCents: number | null;
        amountRefundedCents: number | null;
      }
    | null;
  review: { id: string } | null;
};

function getGuestPaymentStatus(booking: Booking) {
  const mp = booking.bnhubReservationPayment?.paymentStatus;
  if (mp === "PAID") return { label: "Paid", tone: "text-emerald-400" };
  if (mp === "PROCESSING") return { label: "Payment processing", tone: "text-sky-400" };
  if (mp === "REQUIRES_ACTION") return { label: "Payment action needed", tone: "text-amber-300" };
  if (mp === "FAILED") return { label: "Payment failed", tone: "text-rose-400" };
  if (booking.payment?.status === "COMPLETED") return { label: "Paid", tone: "text-emerald-400" };
  if (booking.payment?.status === "PENDING") return { label: "Awaiting payment", tone: "text-amber-300" };
  return { label: booking.payment?.status ? booking.payment.status.toLowerCase() : "No payment yet", tone: "text-slate-500" };
}

export function TripsClient({ bookings }: { bookings: Booking[] }) {
  if (bookings.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-8 text-center">
        <p className="text-slate-400">You don’t have any trips yet.</p>
        <Link href="/bnhub/stays" className="mt-3 inline-block text-sm font-medium text-emerald-400 hover:text-emerald-300">
          Search stays →
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-premium-gold">All reservations</p>
          <h2 className="mt-1 text-xl font-semibold text-white">Reservation list</h2>
        </div>
      </div>
      <ul className="space-y-4">
      {bookings.map((b) => {
        const photo = b.listing.photos[0];
        const canReview = b.status === "COMPLETED" && !b.review;
        const paymentStatus = getGuestPaymentStatus(b);
        return (
          <li
            key={b.id}
            className="flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#11151b] shadow-lg shadow-black/25 sm:flex-row"
          >
            <Link href={`/bnhub/${b.listing.id}`} className="relative h-40 w-full shrink-0 bg-slate-800 sm:h-32 sm:w-48">
              {photo ? (
                <img src={photo} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-slate-500">No photo</div>
              )}
              <span className="absolute bottom-2 left-2 rounded-full bg-black/80 px-2.5 py-1 text-xs font-medium text-slate-100 ring-1 ring-white/10">
                {b.status}
              </span>
            </Link>
            <div className="flex flex-1 flex-col justify-between p-4">
              <div>
                <Link href={`/bnhub/${b.listing.id}`} className="font-semibold text-slate-100 hover:text-emerald-300">
                  {b.listing.title}
                </Link>
                <p className="mt-1 text-sm text-slate-400">
                  {b.listing.city} · {new Date(b.checkIn).toLocaleDateString()} – {new Date(b.checkOut).toLocaleDateString()} · {b.nights} night{b.nights !== 1 ? "s" : ""}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Total ${((b.totalCents + b.guestFeeCents) / 100).toFixed(2)}
                  <span className={`ml-2 ${paymentStatus.tone}`}>{paymentStatus.label}</span>
                </p>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  href={`/bnhub/booking/${b.id}`}
                  className="rounded-full border border-premium-gold/35 bg-premium-gold/10 px-3 py-1.5 text-sm font-semibold text-premium-gold hover:bg-premium-gold/20"
                >
                  View booking
                </Link>
                <Link
                  href={`/guest/payments/${b.id}`}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium text-slate-200 hover:bg-white/10"
                >
                  Payment details
                </Link>
                {canReview && (
                  <Link
                    href={`/bnhub/booking/${b.id}/review`}
                    className="rounded-full bg-emerald-500/20 px-3 py-1.5 text-sm font-medium text-emerald-300 hover:bg-emerald-500/30"
                  >
                    Leave review
                  </Link>
                )}
              </div>
            </div>
          </li>
        );
      })}
      </ul>
    </div>
  );
}
