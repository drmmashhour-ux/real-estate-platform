"use client";

import { useState, useEffect } from "react";

function HostCalendarStrip({ listingId }: { listingId: string }) {
  const [data, setData] = useState<{
    bookedDates: string[];
    externalBlockedDates: string[];
    conflictDates: string[];
  } | null>(null);

  useEffect(() => {
    fetch(`/api/bnhub/availability-summary?listingId=${encodeURIComponent(listingId)}`)
      .then((r) => r.json())
      .then((d) =>
        setData({
          bookedDates: d.bookedDates ?? [],
          externalBlockedDates: d.externalBlockedDates ?? [],
          conflictDates: d.conflictDates ?? [],
        })
      )
      .catch(() => setData(null));
  }, [listingId]);

  const days = 42;
  const today = new Date();
  const monday = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
  );
  const dow = monday.getUTCDay();
  monday.setUTCDate(monday.getUTCDate() - ((dow + 6) % 7));

  const cells: { iso: string; label: number }[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(monday);
    d.setUTCDate(monday.getUTCDate() + i);
    cells.push({ iso: d.toISOString().slice(0, 10), label: d.getUTCDate() });
  }

  const booked = new Set(data?.bookedDates ?? []);
  const ext = new Set(data?.externalBlockedDates ?? []);
  const conflicts = new Set(data?.conflictDates ?? []);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
      <h3 className="text-sm font-semibold text-white">Next 6 weeks</h3>
      <p className="mt-1 text-xs text-slate-500">
        <span className="mr-3 inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-emerald-500" /> BNHUB booking
        </span>
        <span className="mr-3 inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-sky-500" /> External / imported
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-red-500" /> Conflict
        </span>
      </p>
      <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[10px] text-slate-500">
        {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((x) => (
          <div key={x}>{x}</div>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((c) => {
          const isConflict = conflicts.has(c.iso);
          const isBnhub = booked.has(c.iso);
          const isExt = ext.has(c.iso) && !isBnhub;
          let bg = "bg-slate-800/40 text-slate-500";
          if (isConflict) bg = "bg-red-500/30 text-red-100 ring-1 ring-red-500/50";
          else if (isBnhub) bg = "bg-emerald-500/25 text-emerald-100";
          else if (isExt) bg = "bg-sky-500/25 text-sky-100";
          return (
            <div key={c.iso} className={`rounded-md py-2 text-xs font-medium ${bg}`} title={c.iso}>
              {c.label}
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-slate-500">
        Manage iCal import/export in{" "}
        <a href="/bnhub/host/channel-manager" className="text-amber-400 hover:underline">
          Channel manager
        </a>
        .
      </p>
    </div>
  );
}

export function HostAvailabilityClient({ listingId }: { listingId: string }) {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [available, setAvailable] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const today = new Date();
    const nextMonth = new Date(today);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    setStart(today.toISOString().slice(0, 10));
    setEnd(nextMonth.toISOString().slice(0, 10));
  }, []);

  async function handleSetRange(e: React.FormEvent) {
    e.preventDefault();
    if (!start || !end) return;
    setMessage("");
    setLoading(true);
    const startDate = new Date(start);
    const endDate = new Date(end);
    let ok = 0;
    let err = 0;
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      try {
        const res = await fetch("/api/bnhub/availability", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            listingId,
            date: d.toISOString().slice(0, 10),
            available,
          }),
        });
        if (res.ok) ok++;
        else err++;
      } catch {
        err++;
      }
    }
    setLoading(false);
    setMessage(err === 0 ? `Updated ${ok} days.` : `Updated ${ok} days, ${err} failed.`);
  }

  return (
    <div className="space-y-8">
      <HostCalendarStrip listingId={listingId} />
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
      <p className="text-sm text-slate-400">
        Set which dates are available for booking. Existing bookings are always respected.
      </p>
      <form onSubmit={handleSetRange} className="mt-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">From</label>
            <input
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">To</label>
            <input
              type="date"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="available"
            checked={available}
            onChange={(e) => setAvailable(e.target.checked)}
            className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-emerald-500"
          />
          <label htmlFor="available" className="text-sm text-slate-400">Available for booking</label>
        </div>
        {message && <p className="text-sm text-emerald-400">{message}</p>}
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
        >
          {loading ? "Updating…" : "Set availability"}
        </button>
      </form>
    </div>
    </div>
  );
}
