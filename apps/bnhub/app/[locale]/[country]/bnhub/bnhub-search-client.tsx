"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

type Listing = {
  id: string;
  title: string;
  city: string;
  nightPriceCents: number;
  photos: string[];
  verificationStatus: string;
  maxGuests: number;
  beds: number;
  baths: number;
  _count: { reviews: number };
};

export function BNHubSearchClient() {
  const [city, setCity] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [guests, setGuests] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sort, setSort] = useState<"newest" | "priceAsc" | "priceDesc" | "recommended">("recommended");
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchListings = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (city) params.set("city", city);
    if (checkIn) params.set("checkIn", checkIn);
    if (checkOut) params.set("checkOut", checkOut);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (guests) params.set("guests", guests);
    if (verifiedOnly) params.set("verifiedOnly", "true");
    params.set("sort", sort);
    fetch(`/api/bnhub/listings?${params}`)
      .then((res) => res.json())
      .then((data) => setListings(Array.isArray(data) ? data : []))
      .catch(() => setListings([]))
      .finally(() => setLoading(false));
  }, [city, checkIn, checkOut, minPrice, maxPrice, guests, verifiedOnly, sort]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const resetFilters = useCallback(() => {
    setCity("");
    setCheckIn("");
    setCheckOut("");
    setMinPrice("");
    setMaxPrice("");
    setGuests("");
    setVerifiedOnly(false);
    setSort("recommended");
  }, []);

  return (
    <>
      <div className="mb-6 space-y-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[140px]">
            <label className="mb-1 block text-xs font-medium text-slate-400">City</label>
            <input
              type="text"
              placeholder="e.g. Montreal"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
            />
          </div>
          <div className="min-w-[140px]">
            <label className="mb-1 block text-xs font-medium text-slate-400">Check-in</label>
            <input
              type="date"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
            />
          </div>
          <div className="min-w-[140px]">
            <label className="mb-1 block text-xs font-medium text-slate-400">Check-out</label>
            <input
              type="date"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
            />
          </div>
          <div className="min-w-[100px]">
            <label className="mb-1 block text-xs font-medium text-slate-400">Guests</label>
            <input
              type="number"
              min={1}
              placeholder="1"
              value={guests}
              onChange={(e) => setGuests(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="verifiedOnly"
              checked={verifiedOnly}
              onChange={(e) => setVerifiedOnly(e.target.checked)}
              className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-400"
            />
            <label htmlFor="verifiedOnly" className="text-xs text-slate-400">Verified only</label>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4 border-t border-slate-800 pt-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Price ($):</span>
            <input
              type="number"
              min={0}
              placeholder="Min"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-20 rounded-lg border border-slate-700 bg-slate-950/60 px-2 py-1.5 text-sm text-slate-100"
            />
            <span className="text-slate-500">–</span>
            <input
              type="number"
              min={0}
              placeholder="Max"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-20 rounded-lg border border-slate-700 bg-slate-950/60 px-2 py-1.5 text-sm text-slate-100"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500">Sort:</label>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as "newest" | "priceAsc" | "priceDesc" | "recommended")}
              className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-1.5 text-sm text-slate-100 focus:border-emerald-400 focus:outline-none"
            >
              <option value="recommended">Recommended</option>
              <option value="newest">Newest</option>
              <option value="priceAsc">Price: low to high</option>
              <option value="priceDesc">Price: high to low</option>
            </select>
          </div>
          <button
            type="button"
            onClick={fetchListings}
            className="rounded-lg bg-emerald-500/20 px-3 py-1.5 text-sm font-medium text-emerald-300 hover:bg-emerald-500/30"
          >
            Apply
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading listings…</p>
      ) : listings.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-8 text-center">
          <p className="font-medium text-slate-200">No stays match these filters</p>
          <p className="mt-2 text-sm text-slate-400">
            Widen city or dates, clear price caps, or reset — Québec inventory changes daily on BNHub.
          </p>
          <div className="mt-6 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
            <button
              type="button"
              onClick={resetFilters}
              className="min-h-[44px] rounded-lg bg-emerald-500/25 px-5 py-2.5 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/35"
            >
              Reset filters
            </button>
            <Link
              href="/bnhub/stays"
              className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-slate-600 px-5 py-2.5 text-sm font-medium text-slate-200 hover:border-emerald-400/50"
            >
              Browse featured stays
            </Link>
            <Link
              href="/bnhub/host/dashboard"
              className="inline-flex min-h-[44px] items-center justify-center text-sm font-medium text-emerald-400/90 underline decoration-emerald-500/30 underline-offset-2 hover:text-emerald-300"
            >
              Host dashboard
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <Link
              key={listing.id}
              href={`/bnhub/${listing.id}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 transition hover:border-emerald-400/50 hover:shadow-lg hover:shadow-emerald-500/10"
            >
              <div className="relative h-48 overflow-hidden bg-slate-800">
                {listing.photos[0] ? (
                  <img
                    src={listing.photos[0]}
                    alt=""
                    className="h-full w-full object-cover transition group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-slate-600">
                    No photo
                  </div>
                )}
                <span className="absolute left-3 top-3 rounded-full bg-slate-900/90 px-2.5 py-1 text-xs font-medium text-slate-200">
                  ${(listing.nightPriceCents / 100).toFixed(0)} / night
                </span>
                {listing.verificationStatus === "VERIFIED" && (
                  <span className="absolute right-3 top-3 rounded-full bg-emerald-500/90 px-2.5 py-1 text-xs font-medium text-slate-950">
                    Verified listing
                  </span>
                )}
              </div>
              <div className="flex flex-1 flex-col p-4">
                <h2 className="font-semibold text-slate-100 group-hover:text-emerald-300">
                  {listing.title}
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  {listing.city} · {listing.beds} beds · {listing.baths} baths · up to {listing.maxGuests} guests
                </p>
                {listing._count.reviews > 0 && (
                  <p className="mt-2 text-xs text-slate-500">
                    {listing._count.reviews} review{listing._count.reviews !== 1 ? "s" : ""}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
