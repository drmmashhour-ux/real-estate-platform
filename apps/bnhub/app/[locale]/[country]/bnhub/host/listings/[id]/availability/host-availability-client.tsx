"use client";

import { useState, useEffect } from "react";

function HostCalendarStrip({ listingId }: { listingId: string }) {
  const [data, setData] = useState<{
    bookedDates: string[];
    externalBlockedDates: string[];
    conflictDates: string[];
    bookingsByDate?: Record<string, { id: string; guestName: string }>;
  } | null>(null);

  useEffect(() => {
    fetch(`/api/bnhub/availability-summary?listingId=${encodeURIComponent(listingId)}&include_bookings=1`)
      .then((r) => r.json())
      .then((d) =>
        setData({
          bookedDates: d.bookedDates ?? [],
          externalBlockedDates: d.externalBlockedDates ?? [],
          conflictDates: d.conflictDates ?? [],
          bookingsByDate: d.bookingsByDate ?? {},
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

  const cells: { iso: string; label: number; isToday: boolean }[] = [];
  const todayIso = new Date().toISOString().slice(0, 10);
  for (let i = 0; i < days; i++) {
    const d = new Date(monday);
    d.setUTCDate(monday.getUTCDate() + i);
    const iso = d.toISOString().slice(0, 10);
    cells.push({ iso, label: d.getUTCDate(), isToday: iso === todayIso });
  }

  const booked = new Set(data?.bookedDates ?? []);
  const ext = new Set(data?.externalBlockedDates ?? []);
  const conflicts = new Set(data?.conflictDates ?? []);

  return (
    <div className="bnhub-card-polish bnhub-panel-muted p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold tracking-tight text-white uppercase italic">Forward Calendar</h3>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">6 Week Outlook</p>
      </div>
      
      <div className="mt-6 flex flex-wrap gap-4 border-b border-white/5 pb-4">
        <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
          <span className="h-2 w-2 rounded-full bg-red-500" /> Booked
        </span>
        <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
          <span className="h-2 w-2 rounded-full bg-zinc-600" /> Blocked
        </span>
        <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
          <span className="h-2 w-2 rounded-full border border-white/20 bg-white/5" /> Available
        </span>
      </div>

      <div className="mt-6 grid grid-cols-7 gap-2 text-center text-[10px] font-black uppercase tracking-widest text-neutral-600">
        {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((x) => (
          <div key={x}>{x}</div>
        ))}
      </div>
      
      <div className="mt-2 grid grid-cols-7 gap-2">
        {cells.map((c) => {
          const isConflict = conflicts.has(c.iso);
          const isBnhub = booked.has(c.iso);
          const isExt = ext.has(c.iso) && !isBnhub;
          const booking = data?.bookingsByDate?.[c.iso];
          
          let bg = "bg-white/5 text-neutral-400 border border-white/5 hover:border-white/20";
          if (isConflict) bg = "bg-red-500/20 text-red-200 border border-red-500/50 hover:bg-red-500/30";
          else if (isBnhub) bg = "bg-red-500 text-white shadow-lg shadow-red-500/20 hover:brightness-110";
          else if (isExt) bg = "bg-zinc-700 text-neutral-300 border border-zinc-600 hover:bg-zinc-600";
          
          if (c.isToday && !isBnhub && !isExt && !isConflict) {
            bg = "bg-premium-gold/10 text-premium-gold border border-premium-gold/50";
          }

          const Element = booking ? 'a' : 'div';
          const props = booking ? { href: `/bnhub/booking/${booking.id}`, target: "_blank" } : {};

          return (
            <Element 
              key={c.iso} 
              {...props}
              className={`relative flex h-10 w-full items-center justify-center rounded-lg text-xs font-bold transition-all duration-200 cursor-default ${booking ? 'cursor-pointer hover:scale-105 active:scale-95' : ''} ${bg}`}
              title={booking ? `Booking for ${booking.guestName}` : c.iso}
            >
              {c.label}
              {c.isToday && (
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-premium-gold opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-premium-gold"></span>
                </span>
              )}
            </Element>
          );
        })}
      </div>
      
      <div className="mt-8 flex items-center justify-between border-t border-white/5 pt-4">
        <p className="text-[10px] text-neutral-500 font-medium italic">
          iCal syncs every 15 minutes or via <a href="/bnhub/host/channel-manager" className="text-premium-gold hover:underline">Webhook</a>.
        </p>
      </div>
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
    <div className="bnhub-card-polish bnhub-panel-muted p-8 space-y-8">
      <div>
        <h3 className="text-xl font-black tracking-tighter text-white uppercase italic">Inventory Control</h3>
        <p className="mt-2 text-xs leading-relaxed text-neutral-500 max-w-md">
          Precision inventory management. Select a date range to mark as available or manually blocked. Existing guest reservations are protected.
        </p>
      </div>

      <form onSubmit={handleSetRange} className="space-y-8">
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">From</label>
            <input
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              required
              className="bnhub-input w-full"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">To</label>
            <input
              type="date"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              required
              className="bnhub-input w-full"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/5 p-4">
          <input
            type="checkbox"
            id="available"
            checked={available}
            onChange={(e) => setAvailable(e.target.checked)}
            className="h-5 w-5 rounded border-premium-gold/30 bg-black text-premium-gold focus:ring-premium-gold/40"
          />
          <label htmlFor="available" className="text-sm font-bold text-neutral-200">Set as available for guest booking</label>
        </div>

        {message && (
          <div className="rounded-lg bg-premium-gold/10 border border-premium-gold/20 p-3 text-sm font-bold text-premium-gold text-center">
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="bnhub-touch-feedback w-full rounded-xl bg-premium-gold py-4 text-sm font-black uppercase tracking-[0.2em] text-black shadow-xl shadow-premium-gold/20 disabled:opacity-50"
        >
          {loading ? "Synchronizing..." : "Update Availability"}
        </button>
      </form>
    </div>
    </div>
  );
}
