"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

type Props = {
  /** Localized search path, e.g. `/en/ca/search/bnhub` */
  searchBasePath: string;
};

export function BnhubHomeHero({ searchBasePath }: Props) {
  const router = useRouter();
  const [location, setLocation] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [guests, setGuests] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");

  const submit = useCallback(() => {
    const params = new URLSearchParams();
    const q = location.trim();
    if (q) {
      const upper = q.toUpperCase();
      if (/^(LST-|LEC-)/i.test(q) || /^LST[A-Z0-9-]+$/i.test(upper.replace(/\s/g, ""))) {
        params.set("listingCode", q.replace(/\s/g, ""));
      } else {
        params.set("location", q);
      }
    }
    const g = parseInt(guests, 10);
    if (!Number.isNaN(g) && g > 0) params.set("guests", String(g));
    if (checkIn) params.set("checkIn", checkIn);
    if (checkOut) params.set("checkOut", checkOut);
    if (priceMin.trim()) params.set("minPrice", priceMin.trim());
    if (priceMax.trim()) params.set("maxPrice", priceMax.trim());

    const qs = params.toString();
    router.push(qs ? `${searchBasePath}?${qs}` : searchBasePath);
  }, [checkIn, checkOut, guests, location, priceMax, priceMin, router, searchBasePath]);

  const field =
    "min-h-[52px] w-full rounded-2xl border border-white/12 bg-white/[0.06] px-4 text-base text-white placeholder:text-white/40 focus:border-[#D4AF37]/55 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20";

  return (
    <section className="bg-[#000] px-4 pb-16 pt-12 sm:pb-24 sm:pt-16 md:pt-20">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl md:text-5xl lg:text-[3.25rem] lg:leading-tight">
          Find your perfect stay
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-pretty text-base text-white/60 sm:text-lg">
          Verified listings. Smart recommendations. Safer bookings.
        </p>

        <div className="mx-auto mt-10 max-w-2xl rounded-3xl border border-[#D4AF37]/20 bg-white/[0.04] p-4 shadow-[0_0_80px_rgba(212,175,55,0.12)] backdrop-blur-md sm:p-5">
          <label className="sr-only" htmlFor="bnhub-home-search">
            Search by city, address, or listing ID
          </label>
          <input
            id="bnhub-home-search"
            type="search"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), submit())}
            placeholder="Search by city, address, or listing ID"
            autoComplete="off"
            className={`${field} text-center sm:text-left`}
          />

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="sm:col-span-1">
              <label className="mb-1.5 block text-left text-[11px] font-medium uppercase tracking-wider text-white/45">
                Dates
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} className={field} />
                <input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} className={field} />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-left text-[11px] font-medium uppercase tracking-wider text-white/45">
                Guests
              </label>
              <input
                type="number"
                min={1}
                inputMode="numeric"
                placeholder="Any"
                value={guests}
                onChange={(e) => setGuests(e.target.value)}
                className={field}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-left text-[11px] font-medium uppercase tracking-wider text-white/45">
                Price / night
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  placeholder="Min"
                  value={priceMin}
                  onChange={(e) => setPriceMin(e.target.value)}
                  className={field}
                />
                <input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  placeholder="Max"
                  value={priceMax}
                  onChange={(e) => setPriceMax(e.target.value)}
                  className={field}
                />
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={submit}
            className="mt-5 min-h-[56px] w-full rounded-2xl bg-[#D4AF37] text-base font-semibold text-black transition hover:brightness-110 active:brightness-95"
          >
            Search stays
          </button>
        </div>
      </div>
    </section>
  );
}
