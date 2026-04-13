import Link from "next/link";
import { getHotelsForDashboard, getAllHotelBookings } from "@/lib/hotel-hub";
import { HotelDashboardClient } from "./HotelDashboardClient";

export default async function HotelDashboardPage() {
  const [hotels, bookings] = await Promise.all([
    getHotelsForDashboard(),
    getAllHotelBookings(),
  ]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Link
              href="/search/hotels"
              className="text-sm font-medium text-slate-500 hover:text-slate-700"
            >
              ← Hotel Hub
            </Link>
            <h1 className="text-xl font-semibold text-slate-900">Hotel dashboard</h1>
          </div>
          <HotelDashboardClient />
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {/* Hotels & rooms */}
        <section className="mb-10">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">Hotels & rooms</h2>
          {hotels.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-slate-500">
              No hotels yet. Add a hotel to get started.
            </p>
          ) : (
            <ul className="space-y-6">
              {hotels.map((hotel) => (
                <li
                  key={hotel.id}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <Link
                        href={`/hotel/${hotel.id}`}
                        className="font-semibold text-slate-900 hover:text-blue-600"
                      >
                        {hotel.name}
                      </Link>
                      <p className="mt-1 text-sm text-slate-500">{hotel.location}</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">
                      {hotel._count.rooms} room{hotel._count.rooms !== 1 ? "s" : ""}
                    </span>
                  </div>
                  {hotel.rooms.length > 0 ? (
                    <div className="mt-4 border-t border-slate-100 pt-4">
                      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                        Rooms & pricing
                      </p>
                      <ul className="space-y-2">
                        {hotel.rooms.map((room) => (
                          <li
                            key={room.id}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2"
                          >
                            <span className="font-medium text-slate-800">
                              {room.title}
                            </span>
                            <span className="text-sm text-slate-600">
                              Capacity: {room.capacity}
                            </span>
                            <HotelDashboardClient
                              roomId={room.id}
                              currentPrice={room.price}
                              hotelId={hotel.id}
                              mode="room"
                            />
                          </li>
                        ))}
                      </ul>
                      <HotelDashboardClient hotelId={hotel.id} mode="add-room" />
                    </div>
                  ) : (
                    <div className="mt-4">
                      <HotelDashboardClient hotelId={hotel.id} mode="add-room" />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Bookings */}
        <section>
          <h2 className="mb-4 text-lg font-semibold text-slate-800">Recent bookings</h2>
          {bookings.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-slate-500">
              No bookings yet.
            </p>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="min-w-full divide-y divide-slate-200">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">
                      Guest
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">
                      Hotel / Room
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">
                      Check-in – Check-out
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase text-slate-500">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {bookings.slice(0, 20).map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">
                        {b.guestName}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {b.room.hotel.name} / {b.room.title}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {new Date(b.checkIn).toLocaleDateString()} –{" "}
                        {new Date(b.checkOut).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-slate-900">
                        ${b.totalPrice.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {bookings.length > 20 && (
                <p className="border-t border-slate-200 px-4 py-2 text-center text-sm text-slate-500">
                  Showing latest 20 of {bookings.length} bookings
                </p>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
