"use client";

import { useMemo, useState } from "react";
import type { HostCalendarBlockedEvent, HostCalendarBookingEvent } from "@/lib/host/calendar-data";

const GOLD = "#D4AF37";

type Props = {
  listings: { id: string; title: string }[];
  bookings: HostCalendarBookingEvent[];
  blocked: HostCalendarBlockedEvent[];
  initialListingId?: string;
};

function statusColor(status: string, pay: string | null) {
  if (status.includes("CANCEL") || status === "DECLINED" || status === "EXPIRED") return "bg-red-500/30 border-red-500/50";
  if (status === "CONFIRMED" && pay === "COMPLETED") return "bg-emerald-500/25 border-emerald-500/50";
  if (status === "PENDING" || pay === "PENDING") return "bg-amber-500/20 border-amber-500/45";
  return "bg-zinc-500/20 border-zinc-500/40";
}

export function HostCalendarClient({ listings, bookings, blocked, initialListingId }: Props) {
  const [listingFilter, setListingFilter] = useState(initialListingId ?? "");
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
  });
  const [detail, setDetail] = useState<HostCalendarBookingEvent | null>(null);

  const year = cursor.getUTCFullYear();
  const month = cursor.getUTCMonth();
  const firstDow = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

  const filteredBookings = useMemo(
    () =>
      listingFilter
        ? bookings.filter((b) => b.listingId === listingFilter)
        : bookings,
    [bookings, listingFilter]
  );
  const filteredBlocked = useMemo(
    () =>
      listingFilter ? blocked.filter((b) => b.listingId === listingFilter) : blocked,
    [blocked, listingFilter]
  );

  const byDay = useMemo(() => {
    const m: Record<string, { bookings: HostCalendarBookingEvent[]; blocked: HostCalendarBlockedEvent[] }> = {};
    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      m[key] = { bookings: [], blocked: [] };
    }
    for (const b of filteredBookings) {
      for (let d = 1; d <= daysInMonth; d++) {
        const dayStart = new Date(Date.UTC(year, month, d));
        const dayEnd = new Date(Date.UTC(year, month, d + 1));
        if (b.start < dayEnd && b.end > dayStart) {
          const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
          m[key]?.bookings.push(b);
        }
      }
    }
    for (const s of filteredBlocked) {
      if (s.date.startsWith(`${year}-${String(month + 1).padStart(2, "0")}`)) {
        m[s.date]?.blocked.push(s);
      }
    }
    return m;
  }, [filteredBookings, filteredBlocked, year, month, daysInMonth]);

  const cells: (number | null)[] = [...Array(firstDow).fill(null)];
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300"
            onClick={() => setCursor(new Date(Date.UTC(year, month - 1, 1)))}
          >
            ←
          </button>
          <span className="text-sm font-semibold text-white">
            {new Date(Date.UTC(year, month, 1)).toLocaleString("en-CA", {
              month: "long",
              year: "numeric",
              timeZone: "UTC",
            })}
          </span>
          <button
            type="button"
            className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300"
            onClick={() => setCursor(new Date(Date.UTC(year, month + 1, 1)))}
          >
            →
          </button>
        </div>
        <select
          value={listingFilter}
          onChange={(e) => setListingFilter(e.target.value)}
          className="rounded-xl border border-zinc-700 bg-black px-3 py-2 text-sm text-white"
        >
          <option value="">All listings</option>
          {listings.map((l) => (
            <option key={l.id} value={l.id}>
              {l.title.slice(0, 40)}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-medium uppercase text-zinc-500 sm:text-xs">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="py-2">
            {d}
          </div>
        ))}
        {cells.map((d, i) => {
          if (d == null) return <div key={`e-${i}`} className="min-h-[72px] rounded-lg bg-transparent sm:min-h-[88px]" />;
          const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
          const cell = byDay[key] ?? { bookings: [], blocked: [] };
          return (
            <div
              key={key}
              className="min-h-[72px] rounded-lg border border-zinc-800 bg-[#111] p-1 text-left sm:min-h-[88px]"
            >
              <div className="text-xs font-semibold text-zinc-400">{d}</div>
              <div className="mt-1 space-y-0.5">
                {cell.blocked.length > 0 ? (
                  <div className="truncate rounded border border-zinc-600 bg-zinc-800/80 px-1 py-0.5 text-[9px] text-zinc-300">
                    Blocked
                  </div>
                ) : null}
                {cell.bookings.slice(0, 2).map((b) => (
                  <button
                    key={b.id + key}
                    type="button"
                    onClick={() => setDetail(b)}
                    className={`block w-full truncate rounded border px-1 py-0.5 text-left text-[9px] text-white sm:text-[10px] ${statusColor(b.status, b.paymentStatus)}`}
                  >
                    {b.title}
                  </button>
                ))}
                {cell.bookings.length > 2 ? (
                  <div className="text-[9px] text-zinc-500">+{cell.bookings.length - 2}</div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-zinc-500">
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-emerald-500/50" /> Paid / confirmed
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-amber-500/50" /> Pending
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-red-500/50" /> Canceled
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-zinc-600" /> Blocked night
        </span>
      </div>

      {detail ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center"
          role="dialog"
          aria-modal
        >
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-[#111] p-5 shadow-xl">
            <p className="text-sm font-semibold text-white">{detail.title}</p>
            <p className="mt-1 text-xs text-zinc-500">{detail.listingTitle}</p>
            <p className="mt-3 text-sm text-zinc-300">
              {detail.start.toISOString().slice(0, 10)} → {detail.end.toISOString().slice(0, 10)}
            </p>
            <p className="mt-2 text-xs text-zinc-500">
              {detail.status} · {detail.paymentStatus ?? "—"}
            </p>
            <div className="mt-4 flex gap-2">
              <a
                href={`/host/bookings/${detail.id}`}
                className="flex-1 rounded-xl py-2 text-center text-sm font-semibold text-black"
                style={{ backgroundColor: GOLD }}
              >
                Open booking
              </a>
              <button
                type="button"
                className="rounded-xl border border-zinc-600 px-4 py-2 text-sm text-zinc-300"
                onClick={() => setDetail(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
