import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@repo/db";

export default async function HotelBookingConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const booking = await prisma.hotelBooking.findUnique({
    where: { id },
    include: {
      room: { include: { hotel: true } },
    },
  });

  if (!booking) notFound();

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-2xl px-4 py-4">
          <Link
            href="/search/hotels"
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            ← Hotel Hub
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-slate-900">Booking confirmed</h1>
          <p className="mt-2 text-slate-600">
            Your reservation at {booking.room.hotel.name} is confirmed.
          </p>

          <dl className="mt-8 space-y-4 border-t border-slate-200 pt-6">
            <div>
              <dt className="text-sm font-medium text-slate-500">Booking reference</dt>
              <dd className="mt-1 font-mono text-slate-900">{booking.id}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-500">Hotel</dt>
              <dd className="mt-1 text-slate-900">{booking.room.hotel.name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-500">Room</dt>
              <dd className="mt-1 text-slate-900">{booking.room.title}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-500">Guest</dt>
              <dd className="mt-1 text-slate-900">{booking.guestName}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-500">Check-in – Check-out</dt>
              <dd className="mt-1 text-slate-900">
                {new Date(booking.checkIn).toLocaleDateString()} – {new Date(booking.checkOut).toLocaleDateString()}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-500">Total</dt>
              <dd className="mt-1 text-lg font-semibold text-slate-900">
                ${booking.totalPrice.toFixed(2)}
              </dd>
            </div>
          </dl>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={`/hotel/${booking.room.hotel.id}`}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              View hotel
            </Link>
            <Link
              href="/search/hotels"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Search more hotels
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
