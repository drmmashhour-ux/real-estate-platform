"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Calendar, ChevronDown, MapPin, Search, Users, X } from "lucide-react";

function fmtDateShort(iso: string) {
  if (!iso) return "";
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/**
 * Marketplace-style search strip for BNHUB home: Booking.com–style gold frame + Airbnb-like segmented pill.
 * Submits to `/bnhub/stays` with query params consumed by {@link BnhubStaysQuerySync}.
 */
export function BnhubLandingHubSearch({ accent = "booking" }: { accent?: "booking" | "prestige" } = {}) {
  const router = useRouter();
  const destId = useId();
  const [location, setLocation] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(2);
  const [datesOpen, setDatesOpen] = useState(false);
  const [guestsOpen, setGuestsOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function close(e: MouseEvent) {
      const t = e.target as Node;
      if (wrapRef.current && !wrapRef.current.contains(t)) {
        setDatesOpen(false);
        setGuestsOpen(false);
      }
    }
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  const submit = useCallback(() => {
    const p = new URLSearchParams();
    const city = location.trim();
    if (city) p.set("city", city);
    if (checkIn) p.set("checkIn", checkIn);
    if (checkOut) p.set("checkOut", checkOut);
    p.set("guests", String(Math.min(16, Math.max(1, guests))));
    router.push(`/bnhub/stays?${p.toString()}`);
  }, [location, checkIn, checkOut, guests, router]);

  const rangeLabel =
    checkIn && checkOut
      ? `${fmtDateShort(checkIn)} – ${fmtDateShort(checkOut)}`
      : checkIn
        ? `${fmtDateShort(checkIn)} – Add checkout`
        : "Add dates";

  const outerShadow =
    accent === "prestige"
      ? "0 12px 48px rgba(0,0,0,0.45), 0 0 0 1px rgba(212,175,55,0.2)"
      : "0 8px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,53,128,0.08)";
  const searchBtn =
    accent === "prestige"
      ? "bg-[#d4af37] text-[#0a0a0a] shadow-md hover:brightness-110"
      : "bg-[#006ce4] text-white shadow-md hover:bg-[#0057b8]";

  return (
    <div ref={wrapRef} className="relative z-10 w-full max-w-4xl">
      <div
        className="rounded-[2rem] border-[3px] border-[#d4af37] bg-white p-1.5 sm:p-2"
        style={{ boxShadow: outerShadow }}
      >
        <div className="flex flex-col overflow-hidden rounded-[1.65rem] bg-white sm:flex-row sm:items-stretch sm:divide-x sm:divide-slate-200/90">
          <div className="relative flex min-h-[52px] min-w-0 flex-1 items-center gap-2.5 px-4 py-2 sm:py-3">
            <MapPin className="hidden h-5 w-5 shrink-0 text-slate-400 sm:block" aria-hidden />
            <div className="min-w-0 flex-1">
              <label htmlFor={destId} className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Where
              </label>
              <input
                id={destId}
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City, region, or neighbourhood"
                autoComplete="address-level2"
                className="mt-0.5 w-full border-0 bg-transparent p-0 text-sm font-semibold text-slate-900 placeholder:font-normal placeholder:text-slate-400 focus:outline-none focus:ring-0"
              />
            </div>
            {location ? (
              <button
                type="button"
                aria-label="Clear destination"
                onClick={() => setLocation("")}
                className="shrink-0 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          <div className="relative min-h-[52px] min-w-0 sm:min-w-[200px]">
            <button
              type="button"
              onClick={() => {
                setDatesOpen((o) => !o);
                setGuestsOpen(false);
              }}
              className={`flex h-full w-full items-start gap-2 px-4 py-2 text-left sm:items-center sm:py-3 ${
                datesOpen ? "bg-slate-50" : "hover:bg-slate-50/80"
              }`}
            >
              <Calendar className="mt-0.5 h-5 w-5 shrink-0 text-slate-400 sm:mt-0" aria-hidden />
              <div className="min-w-0 flex-1">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">When</span>
                <span className="mt-0.5 block truncate text-sm font-semibold text-slate-900">{rangeLabel}</span>
              </div>
              <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-slate-400 sm:mt-0" aria-hidden />
            </button>
            {datesOpen ? (
              <div className="absolute left-0 right-0 top-full z-40 mt-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl sm:left-auto sm:min-w-[320px]">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="text-xs font-medium text-slate-600">
                    Check-in
                    <input
                      type="date"
                      value={checkIn}
                      onChange={(e) => setCheckIn(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="text-xs font-medium text-slate-600">
                    Check-out
                    <input
                      type="date"
                      value={checkOut}
                      onChange={(e) => setCheckOut(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    />
                  </label>
                </div>
                <button
                  type="button"
                  className={`mt-3 w-full rounded-xl py-2.5 text-sm font-semibold text-white ${
                    accent === "prestige" ? "bg-[#0a0a0a] hover:bg-black" : "bg-slate-900 hover:bg-slate-800"
                  }`}
                  onClick={() => setDatesOpen(false)}
                >
                  Done
                </button>
              </div>
            ) : null}
          </div>

          <div className="relative min-h-[52px] min-w-0 sm:min-w-[160px]">
            <button
              type="button"
              onClick={() => {
                setGuestsOpen((o) => !o);
                setDatesOpen(false);
              }}
              className={`flex h-full w-full items-start gap-2 px-4 py-2 text-left sm:items-center sm:py-3 ${
                guestsOpen ? "bg-slate-50" : "hover:bg-slate-50/80"
              }`}
            >
              <Users className="mt-0.5 h-5 w-5 shrink-0 text-slate-400 sm:mt-0" aria-hidden />
              <div className="min-w-0 flex-1">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Who</span>
                <span className="mt-0.5 block text-sm font-semibold text-slate-900">
                  {guests} guest{guests !== 1 ? "s" : ""}
                </span>
              </div>
              <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-slate-400 sm:mt-0" aria-hidden />
            </button>
            {guestsOpen ? (
              <div className="absolute right-0 top-full z-40 mt-2 w-[min(100vw-2rem,280px)] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                <p className="text-xs font-semibold text-slate-600">Guests</p>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-lg leading-none hover:bg-slate-50"
                    onClick={() => setGuests((g) => Math.max(1, g - 1))}
                    aria-label="Fewer guests"
                  >
                    −
                  </button>
                  <span className="text-lg font-bold tabular-nums">{guests}</span>
                  <button
                    type="button"
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-lg leading-none hover:bg-slate-50"
                    onClick={() => setGuests((g) => Math.min(16, g + 1))}
                    aria-label="More guests"
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  className={`mt-4 w-full rounded-xl py-2.5 text-sm font-semibold text-white ${
                    accent === "prestige" ? "bg-[#0a0a0a] hover:bg-black" : "bg-slate-900 hover:bg-slate-800"
                  }`}
                  onClick={() => setGuestsOpen(false)}
                >
                  Done
                </button>
              </div>
            ) : null}
          </div>

          <div className="flex items-stretch p-2 sm:w-[4.5rem] sm:shrink-0 sm:items-center sm:justify-center sm:p-2">
            <button
              type="button"
              onClick={submit}
              className={`flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl px-6 text-sm font-bold transition sm:h-14 sm:w-14 sm:min-h-0 sm:rounded-full sm:px-0 sm:shadow-lg ${searchBtn}`}
              aria-label="Search stays"
            >
              <Search className="h-5 w-5 shrink-0" aria-hidden />
              <span className="sm:sr-only">Search</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
