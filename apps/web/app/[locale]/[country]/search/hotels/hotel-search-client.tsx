"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";

type Hotel = {
  id: string;
  name: string;
  location: string;
  description: string | null;
  images: string[];
  rooms: { id: string; title: string; price: number; capacity: number }[];
};

export function HotelSearchClient() {
  const [location, setLocation] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("1");
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);

  const runSearch = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (location.trim()) params.set("location", location.trim());
    if (checkIn) params.set("checkIn", checkIn);
    if (checkOut) params.set("checkOut", checkOut);
    if (guests) params.set("guests", guests);
    fetch(`/api/hotels?${params}`)
      .then((res) => res.json())
      .then((data) => setHotels(Array.isArray(data) ? data : []))
      .catch(() => setHotels([]))
      .finally(() => setLoading(false));
  }, [location, checkIn, checkOut, guests]);

  useEffect(() => {
    runSearch();
  }, [runSearch]);

  const clearFilters = useCallback(() => {
    setLocation("");
    setCheckIn("");
    setCheckOut("");
    setGuests("1");
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <section className="mb-8 rounded-2xl border border-slate-200 bg-slate-50/50 p-6">
        <h1 className="text-xl font-semibold text-slate-900">Find your hotel</h1>
        <p className="mt-1 text-sm text-slate-600">
          Search by location, dates, and number of guests.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label className="block text-sm font-medium text-slate-700">Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="City or area"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Check-in</label>
            <input
              type="date"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Check-out</label>
            <input
              type="date"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Guests</label>
            <input
              type="number"
              min={1}
              value={guests}
              onChange={(e) => setGuests(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={runSearch}
              className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Search
            </button>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="flex min-h-[200px] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
        </div>
      ) : hotels.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-10 text-center">
          <p className="font-medium text-slate-800">No hotels match this search</p>
          <p className="mt-2 text-sm text-slate-600">
            Try a broader city, different dates, or fewer guests — then search again.
          </p>
          <div className="mt-6 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
            <button
              type="button"
              onClick={clearFilters}
              className="min-h-[44px] rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Reset filters
            </button>
            <Link
              href="/bnhub/stays"
              className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-800 hover:bg-slate-50"
            >
              Browse short-term stays
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {hotels.map((hotel) => {
            const img = hotel.images[0];
            const minPrice = hotel.rooms.length
              ? Math.min(...hotel.rooms.map((r) => r.price))
              : 0;
            return (
              <Link
                key={hotel.id}
                href={`/hotel/${hotel.id}${checkIn ? `?checkIn=${checkIn}` : ""}${checkOut ? `&checkOut=${checkOut}` : ""}${guests ? `&guests=${guests}` : ""}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:border-slate-300 hover:shadow-xl"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                  {img ? (
                    <img
                      src={img}
                      alt=""
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-slate-400">
                      No photo
                    </div>
                  )}
                  <span className="absolute left-3 top-3 rounded-lg bg-white/95 px-2.5 py-1.5 text-sm font-semibold text-slate-900 shadow">
                    From ${minPrice.toFixed(0)}/night
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <h2 className="font-semibold text-slate-900 group-hover:text-blue-600">
                    {hotel.name}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">{hotel.location}</p>
                  <p className="mt-2 text-xs text-slate-400">
                    {hotel.rooms.length} room{hotel.rooms.length !== 1 ? "s" : ""} available
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
