import Link from "next/link";
import { getSharedBookings } from "@/lib/shared-booking";
import { SharedBookingCard } from "./shared-booking-card";

export default async function SharedBookingsPage() {
  const bookings = await getSharedBookings();

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6">
          <Link
            href="/"
            className="text-sm font-medium text-slate-500 hover:text-slate-700"
          >
            ← Home
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">
            Shared stays
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Join a stay with others — unique to our platform
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        {bookings.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
            No shared stays available yet.
          </p>
        ) : (
          <ul className="space-y-4">
            {bookings.map((b) => (
              <li key={b.id}>
                <SharedBookingCard
                  id={b.id}
                  listingId={b.listingId}
                  totalSpots={b.totalSpots}
                  bookedSpots={b.bookedSpots}
                  pricePerSpot={b.pricePerSpot}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
