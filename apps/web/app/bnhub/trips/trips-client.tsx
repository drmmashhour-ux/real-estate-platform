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
  review: { id: string } | null;
};

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
    <ul className="space-y-4">
      {bookings.map((b) => {
        const photo = b.listing.photos[0];
        const canReview = b.status === "COMPLETED" && !b.review;
        return (
          <li
            key={b.id}
            className="flex flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 sm:flex-row"
          >
            <Link href={`/bnhub/${b.listing.id}`} className="relative h-40 w-full shrink-0 bg-slate-800 sm:h-32 sm:w-48">
              {photo ? (
                <img src={photo} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-slate-500">No photo</div>
              )}
              <span className="absolute bottom-2 left-2 rounded bg-slate-900/90 px-2 py-1 text-xs font-medium text-slate-200">
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
                  {b.payment?.status === "COMPLETED" && (
                    <span className="ml-2 text-emerald-400">Paid</span>
                  )}
                </p>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  href={`/bnhub/booking/${b.id}`}
                  className="rounded-lg border border-slate-600 bg-slate-800/60 px-3 py-1.5 text-sm font-medium text-slate-200 hover:bg-slate-700"
                >
                  View booking
                </Link>
                {canReview && (
                  <Link
                    href={`/bnhub/booking/${b.id}/review`}
                    className="rounded-lg bg-emerald-500/20 px-3 py-1.5 text-sm font-medium text-emerald-300 hover:bg-emerald-500/30"
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
  );
}
