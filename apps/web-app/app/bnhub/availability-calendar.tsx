"use client";

import { useState, useEffect } from "react";

type Slot = { date: string; available: boolean };

export function AvailabilityCalendar({ listingId }: { listingId: string }) {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
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
    fetch(`/api/bnhub/availability?${params}`)
      .then((res) => res.json())
      .then((data) => setSlots(Array.isArray(data) ? data : []))
      .catch(() => setSlots([]))
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
    return (d.getDay() + 6) % 7; // Monday = 0
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

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
      <h2 className="text-lg font-semibold text-slate-200">Availability</h2>
      <p className="mt-1 text-xs text-slate-500">Green = available (subject to existing bookings)</p>
      <div className="mt-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setMonthOffset((m) => m - 1)}
          className="rounded-lg border border-slate-600 px-2 py-1 text-sm text-slate-400 hover:bg-slate-800"
        >
          ←
        </button>
        <span className="text-sm font-medium text-slate-300">{monthLabel}</span>
        <button
          type="button"
          onClick={() => setMonthOffset((m) => m + 1)}
          className="rounded-lg border border-slate-600 px-2 py-1 text-sm text-slate-400 hover:bg-slate-800"
        >
          →
        </button>
      </div>
      {loading ? (
        <p className="mt-4 text-sm text-slate-500">Loading…</p>
      ) : (
        <div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs">
          {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
            <div key={i} className="font-medium text-slate-500">
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
            const isPast = d < new Date(new Date().setHours(0, 0, 0, 0));
            return (
              <div
                key={day}
                className={`rounded p-1 ${
                  isPast
                    ? "text-slate-600"
                    : available === true
                      ? "bg-emerald-500/30 text-emerald-200"
                      : available === false
                        ? "bg-slate-700 text-slate-400"
                        : "text-slate-400"
                }`}
              >
                {day}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
