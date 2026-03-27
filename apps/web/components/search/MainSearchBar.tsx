"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SpellCheckField } from "@/components/spell/SpellCheckField";
import { parseListingCodeFromSearchQuery } from "@/lib/listing-code-public";

const DEFAULT_SEARCH_HUB = "/search/bnhub";

export function MainSearchBar() {
  const router = useRouter();
  const [location, setLocation] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const loc = location.trim();
    const codeOnly = parseListingCodeFromSearchQuery(loc);
    if (codeOnly) {
      try {
        const res = await fetch(`/api/listings/resolve-code?code=${encodeURIComponent(codeOnly)}`);
        const data = (await res.json()) as { url?: string };
        if (res.ok && data.url) {
          router.push(data.url);
          return;
        }
      } catch {
        /* fall through */
      }
      router.push(`/listings/not-found?code=${encodeURIComponent(codeOnly)}`);
      return;
    }
    const params = new URLSearchParams();
    if (loc) params.set("location", loc);
    if (checkIn) params.set("checkIn", checkIn);
    if (checkOut) params.set("checkOut", checkOut);
    if (guests.trim()) {
      const n = parseInt(guests, 10);
      if (!Number.isNaN(n) && n > 0) params.set("guests", String(n));
    }
    const qs = params.toString();
    router.push(`${DEFAULT_SEARCH_HUB}${qs ? `?${qs}` : ""}`);
  };

  const fieldLabel = "text-[10px] font-semibold uppercase tracking-wider text-[#B3B3B3]";
  const fieldInput =
    "mt-0.5 border-0 bg-transparent p-0 text-sm text-white placeholder:text-[#B3B3B3]/55 focus:ring-0";

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto w-full max-w-4xl rounded-2xl border border-[#C9A646]/25 bg-[#121212]/95 p-2 shadow-[0_20px_50px_rgba(0,0,0,0.55)] backdrop-blur-md transition duration-300 hover:border-[#C9A646]/45 hover:shadow-[0_24px_60px_rgba(201, 166, 70,0.08)] focus-within:border-[#C9A646]/55 focus-within:ring-2 focus-within:ring-[#C9A646]/20 md:flex md:items-stretch md:gap-0"
    >
      <div className="flex flex-1 flex-col rounded-xl md:flex-row md:items-center md:divide-x md:divide-white/10">
        <label className="flex flex-1 flex-col px-4 py-3 md:py-2.5">
          <span className={fieldLabel}>Location</span>
          <SpellCheckField
            id="search-input"
            value={location}
            onChange={setLocation}
            placeholder="Where are you going?"
            className={fieldInput}
            variant="gold"
          />
        </label>
        <label className="flex flex-1 flex-col border-t border-white/10 px-4 py-3 md:border-t-0 md:border-l md:border-l-white/10 md:py-2.5">
          <span className={fieldLabel}>Check-in</span>
          <input
            type="date"
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
            min={new Date().toISOString().slice(0, 10)}
            className={`${fieldInput} [color-scheme:dark]`}
          />
        </label>
        <label className="flex flex-1 flex-col border-t border-white/10 px-4 py-3 md:border-t-0 md:border-l md:border-l-white/10 md:py-2.5">
          <span className={fieldLabel}>Check-out</span>
          <input
            type="date"
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            min={checkIn || new Date().toISOString().slice(0, 10)}
            className={`${fieldInput} [color-scheme:dark]`}
          />
        </label>
        <label className="flex flex-1 flex-col border-t border-white/10 px-4 py-3 md:border-t-0 md:border-l md:border-l-white/10 md:py-2.5">
          <span className={fieldLabel}>Guests</span>
          <input
            type="number"
            min={1}
            max={16}
            placeholder="Guests"
            value={guests}
            onChange={(e) => setGuests(e.target.value)}
            className={fieldInput}
          />
        </label>
      </div>
      <button
        type="submit"
        className="mt-2 inline-flex w-full shrink-0 items-center justify-center rounded-xl bg-[#C9A646] px-8 py-3.5 text-sm font-bold tracking-wide text-black shadow-lg shadow-[#C9A646]/25 transition duration-200 hover:bg-[#C9A227] md:mt-0 md:ml-2 md:w-auto md:self-stretch"
      >
        Search
      </button>
    </form>
  );
}
