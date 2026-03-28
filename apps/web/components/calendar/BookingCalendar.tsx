"use client";

import { useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";

export type CalendarBookingRow = {
  id: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  status: string;
  totalCents: number;
  guestFeeCents?: number;
  specialRequest?: string | null;
  guestNotes?: string | null;
  guest: { name: string | null; email: string };
  listing: { id: string; title: string };
  payment: { hostPayoutCents: number | null; status: string } | null;
};

function dayInBookingRange(day: Date, checkIn: Date, checkOut: Date) {
  const d = startOfDay(day).getTime();
  const a = startOfDay(checkIn).getTime();
  const b = startOfDay(checkOut).getTime();
  return d >= a && d < b;
}

function statusTone(status: string): "booked" | "pending" | "other" {
  if (status === "CONFIRMED" || status === "COMPLETED") return "booked";
  if (status === "AWAITING_HOST_APPROVAL" || status === "PENDING") return "pending";
  return "other";
}

export function BookingCalendar({
  bookings,
  canManage,
}: {
  bookings: CalendarBookingRow[];
  canManage: boolean;
}) {
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState<CalendarBookingRow | null>(null);

  const monthLabel = format(cursor, "MMMM yyyy");
  const gridStart = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
  const gridEnd = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const byDay = useMemo(() => {
    const map = new Map<string, { booking: CalendarBookingRow; tone: "booked" | "pending" | "other" }[]>();
    for (const b of bookings) {
      const ci = parseISO(b.checkIn);
      const co = parseISO(b.checkOut);
      const tone = statusTone(b.status);
      for (const day of days) {
        if (!dayInBookingRange(day, ci, co)) continue;
        const key = format(day, "yyyy-MM-dd");
        const arr = map.get(key) ?? [];
        arr.push({ booking: b, tone });
        map.set(key, arr);
      }
    }
    return map;
  }, [bookings, days]);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-white">Booking calendar</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCursor((c) => subMonths(c, 1))}
            className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800"
          >
            ←
          </button>
          <span className="min-w-[10rem] text-center text-sm font-medium text-slate-300">{monthLabel}</span>
          <button
            type="button"
            onClick={() => setCursor((c) => addMonths(c, 1))}
            className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800"
          >
            →
          </button>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded bg-emerald-500/40 ring-1 ring-emerald-500/60" /> Available (no stay)
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded bg-rose-500/35 ring-1 ring-rose-500/50" /> Booked / confirmed
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded bg-amber-400/35 ring-1 ring-amber-400/50" /> Pending approval / payment
        </span>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-500 sm:text-xs">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d} className="py-2">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const inMonth = isSameMonth(day, cursor);
          const cells = byDay.get(key) ?? [];
          const primary = cells[0];
          return (
            <button
              key={key}
              type="button"
              aria-label={`${format(day, "MMMM d, yyyy")}${primary ? `, ${primary.tone === "booked" ? "booked" : primary.tone === "pending" ? "pending" : "other"}` : ", available"}`}
              onClick={() => {
                if (primary) setSelected(primary.booking);
              }}
              className={`relative flex min-h-[52px] flex-col rounded-lg border p-1 text-left transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-premium-gold/45 sm:min-h-[64px] ${
                !inMonth
                  ? "border-transparent bg-transparent opacity-40"
                  : primary
                    ? primary.tone === "pending"
                      ? "border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/15"
                      : primary.tone === "booked"
                        ? "border-rose-500/35 bg-rose-500/10 hover:bg-rose-500/15"
                        : "border-slate-700 bg-slate-900/80 hover:bg-slate-800"
                    : "border-emerald-500/25 bg-emerald-500/5 hover:bg-emerald-500/10"
              }`}
            >
              <span className={`text-xs font-semibold sm:text-sm ${inMonth ? "text-slate-200" : "text-slate-600"}`}>
                {format(day, "d")}
              </span>
              {cells.length > 0 && (
                <span className="mt-auto truncate text-[9px] font-medium text-slate-400 sm:text-[10px]">
                  {cells.length > 1 ? `${cells.length} stays` : primary?.booking.listing.title.slice(0, 8)}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {selected ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center">
          <div
            role="dialog"
            aria-modal
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-slate-700 bg-slate-950 p-5 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-400/90">{selected.status}</p>
                <h3 className="mt-1 text-lg font-semibold text-white">{selected.listing.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-lg px-2 py-1 text-sm text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                Close
              </button>
            </div>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Guest</dt>
                <dd className="text-right text-slate-200">{selected.guest.name ?? selected.guest.email}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Dates</dt>
                <dd className="text-right text-slate-200">
                  {format(parseISO(selected.checkIn), "MMM d")} – {format(parseISO(selected.checkOut), "MMM d, yyyy")}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Total</dt>
                <dd className="text-right text-slate-200">
                  ${(selected.totalCents / 100).toFixed(2)} + fees
                </dd>
              </div>
              {(selected.specialRequest || selected.guestNotes) && (
                <div>
                  <dt className="text-slate-500">Special requests</dt>
                  <dd className="mt-1 rounded-lg bg-slate-900/80 p-3 text-slate-300">
                    {selected.specialRequest || selected.guestNotes}
                  </dd>
                </div>
              )}
            </dl>
            <div className="mt-5 flex flex-wrap gap-2">
              <a
                href={`/bnhub/booking/${selected.id}`}
                className="rounded-xl border border-slate-600 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800"
              >
                Booking details
              </a>
              {canManage && selected.status === "AWAITING_HOST_APPROVAL" ? (
                <>
                  <button
                    type="button"
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
                    onClick={async () => {
                      const res = await fetch(`/api/bnhub/bookings/${selected.id}/approve`, { method: "POST" });
                      if (res.ok) {
                        setSelected(null);
                        window.location.reload();
                      }
                    }}
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    className="rounded-xl border border-rose-500/50 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-200 hover:bg-rose-500/20"
                    onClick={async () => {
                      const res = await fetch(`/api/bnhub/bookings/${selected.id}/decline`, { method: "POST" });
                      if (res.ok) {
                        setSelected(null);
                        window.location.reload();
                      }
                    }}
                  >
                    Decline
                  </button>
                </>
              ) : null}
              <a
                href={`/dashboard/bnhub/messages`}
                className="rounded-xl border border-slate-600 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800"
              >
                Messages
              </a>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
