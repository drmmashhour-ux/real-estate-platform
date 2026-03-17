"use client";

import { useState, useEffect } from "react";

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
  );
}
