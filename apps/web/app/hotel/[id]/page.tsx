import Link from "next/link";
import { notFound } from "next/navigation";
import { getHotelById } from "@/lib/hotel-hub";
import { HotelBookingForm } from "./hotel-booking-form";

export default async function HotelPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ checkIn?: string; checkOut?: string; guests?: string }>;
}) {
  const { id } = await params;
  const { checkIn, checkOut, guests } = await searchParams;

  const hotel = await getHotelById(id);
  if (!hotel) notFound();

  const imageUrls = hotel.images && Array.isArray(hotel.images) ? hotel.images : [];
  const firstImage = imageUrls[0];

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <Link
            href="/search/hotels"
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            ← Back to search
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
            {hotel.name}
          </h1>
          <p className="mt-1 text-slate-600">{hotel.location}</p>
        </div>

        <div className="relative mb-8 aspect-[3/1] overflow-hidden rounded-2xl bg-slate-200">
          {firstImage ? (
            <img
              src={firstImage}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-slate-400">
              No image
            </div>
          )}
        </div>

        {hotel.description && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-slate-900">About</h2>
            <p className="mt-2 text-slate-600">{hotel.description}</p>
          </div>
        )}

        <h2 className="mb-4 text-lg font-semibold text-slate-900">Rooms</h2>
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="space-y-4">
            {hotel.rooms.length === 0 ? (
              <p className="rounded-xl border border-slate-200 bg-white p-6 text-slate-500">
                No rooms available for your search. Try different dates or guests.
              </p>
            ) : (
              hotel.rooms.map((room) => (
                <div
                  key={room.id}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-slate-900">{room.title}</h3>
                      <p className="mt-1 text-sm text-slate-500">
                        Up to {room.capacity} guest{room.capacity !== 1 ? "s" : ""} · ${room.price.toFixed(0)}/night
                      </p>
                    </div>
                    <HotelBookingForm
                      roomId={room.id}
                      roomTitle={room.title}
                      pricePerNight={room.price}
                      checkIn={checkIn}
                      checkOut={checkOut}
                      guests={guests ? parseInt(guests, 10) : 1}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
          <aside className="hidden lg:block">
            <div className="sticky top-24 rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-medium text-slate-700">Need help?</p>
              <p className="mt-1 text-xs text-slate-500">
                Contact the hotel from the dashboard or modify your search.
              </p>
              <Link
                href="/search/hotels"
                className="mt-3 inline-block text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Change dates →
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
