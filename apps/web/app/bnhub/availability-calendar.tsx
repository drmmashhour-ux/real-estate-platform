"use client";

import { useState, useEffect } from "react";
import { SkeletonBlock } from "@/components/ui/SkeletonBlock";

type Slot = { date: string; available: boolean };

export function AvailabilityCalendar({ listingId }: { listingId: string }) {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [monthOffset, setMonthOffset] = useState(0);

  useEffect(() => {
    const start = new Date();
    start.setMonth(start.getMonth() + monthOffset);
    start.setDate(1);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);
    end.setDate(0);
    const params = new URLSearchParams({
      listingId,
      start: start.toISOString().slice(0, 10),
      end: end.toISOString().slice(0, 10),
    });
    setLoading(true);
    setLoadError(false);
    fetch(`/api/bnhub/availability?${params}`)
      .then((res) => {
        if (!res.ok) throw new Error("bad");
        return res.json();
      })
      .then((data) => setSlots(Array.isArray(data) ? data : []))
      .catch(() => {
        setSlots([]);
        setLoadError(true);
      })
      .finally(() => setLoading(false));
  }, [listingId, monthOffset]);

  const monthLabel = (() => {
    const d = new Date();
    d.setMonth(d.getMonth() + monthOffset);
    return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  })();

  const gridStart = (() => {
    const d = new Date();
    d.setMonth(d.getMonth() + monthOffset);
    d.setDate(1);
    return (d.getDay() + 6) % 7;
  })();
  const daysInMonth = (() => {
    const d = new Date();
    d.setMonth(d.getMonth() + monthOffset + 1);
    d.setDate(0);
    return d.getDate();
  })();
  const slotByDate = new Map(
    slots.map((s) => [typeof s.date === "string" ? s.date.slice(0, 10) : s.date, s.available])
  );

  const todayStart = new Date(new Date().setHours(0, 0, 0, 0)).getTime();

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
      <h2 className="text-lg font-semibold text-slate-900">Availability</h2>
      <div className="mt-2 flex flex-wrap gap-3 text-[10px] text-slate-500 sm:text-xs">
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded bg-emerald-500/35 ring-1 ring-emerald-500/50" /> Available
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded bg-rose-500/35 ring-1 ring-rose-500/45" /> Unavailable / booked
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded bg-amber-400/30 ring-1 ring-amber-400/45" /> Pending / unknown
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <button
          type="button"
          aria-label="Previous month"
          onClick={() => setMonthOffset((m) => m - 1)}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-50"
        >
          ←
        </button>
        <span className="text-sm font-medium text-slate-800">{monthLabel}</span>
        <button
          type="button"
          aria-label="Next month"
          onClick={() => setMonthOffset((m) => m + 1)}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-50"
        >
          →
        </button>
      </div>
      {loading ? (
        <div className="mt-4 space-y-2" aria-busy aria-label="Loading calendar">
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 7 }).map((_, i) => (
              <SkeletonBlock key={i} className="h-6 rounded" />
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 28 }).map((_, i) => (
              <SkeletonBlock key={i} className="h-9 rounded-md" />
            ))}
          </div>
        </div>
      ) : loadError ? (
        <p className="mt-4 text-sm text-amber-200/90">
          Calendar could not be loaded. Refresh the page or try again later.
        </p>
      ) : (
        <div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs">
          {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
            <div key={i} className="py-1 font-medium text-slate-500">
              {d}
            </div>
          ))}
          {Array.from({ length: gridStart }, (_, i) => (
            <div key={`pad-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const d = new Date();
            d.setMonth(d.getMonth() + monthOffset);
            d.setDate(day);
            const dateStr = d.toISOString().slice(0, 10);
            const available = slotByDate.get(dateStr);
            const isPast = d.getTime() < todayStart;
            const tone =
              isPast
                ? "text-slate-400 border-transparent"
                : available === true
                  ? "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  : available === false
                    ? "border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100"
                    : "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100";
            return (
              <button
                key={day}
                type="button"
                disabled={isPast}
                aria-label={`${monthLabel} day ${day}${available === true ? ", available" : available === false ? ", unavailable" : ""}`}
                className={`rounded-md border p-1 text-center text-xs transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-premium-gold/50 disabled:cursor-not-allowed ${tone}`}
              >
                {day}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
