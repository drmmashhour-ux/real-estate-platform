"use client";

import { useMemo, useState } from "react";
import { addDays, addMonths, format, parseISO, startOfMonth, subMonths } from "date-fns";
import type { CalendarBookingRow } from "./BookingCalendar";

/** Product rule: expected payout date shown as check-in + 7 days (adjust to match finance policy). */
const PAYOUT_DAYS_AFTER_CHECKIN = 7;

export function PayoutCalendar({ bookings }: { bookings: CalendarBookingRow[] }) {
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));

  const payouts = useMemo(() => {
    const rows: {
      id: string;
      payoutDate: Date;
      amountCents: number;
      status: string;
      listingTitle: string;
      checkIn: Date;
    }[] = [];
    for (const b of bookings) {
      if (b.status !== "CONFIRMED" && b.status !== "COMPLETED") continue;
      const checkIn = parseISO(b.checkIn);
      const payoutDate = addDays(checkIn, PAYOUT_DAYS_AFTER_CHECKIN);
      const amountCents = b.payment?.hostPayoutCents ?? Math.max(0, b.totalCents - (b.guestFeeCents ?? 0));
      rows.push({
        id: b.id,
        payoutDate,
        amountCents,
        status: b.payment?.status ?? "PENDING",
        listingTitle: b.listing.title,
        checkIn,
      });
    }
    return rows.sort((a, b) => a.payoutDate.getTime() - b.payoutDate.getTime());
  }, [bookings]);

  const monthKey = format(cursor, "yyyy-MM");
  const inMonth = payouts.filter((p) => format(p.payoutDate, "yyyy-MM") === monthKey);
  const upcomingTotal = inMonth.reduce((s, p) => s + p.amountCents, 0);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Payout outlook</h2>
          <p className="mt-1 text-xs text-slate-500">
            Estimated release ~{PAYOUT_DAYS_AFTER_CHECKIN} days after check-in (aligned with escrow). Actual Stripe
            transfers depend on your Connect status.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCursor((c) => subMonths(c, 1))}
            className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800"
          >
            ←
          </button>
          <span className="min-w-[9rem] text-center text-sm font-medium text-slate-300">
            {format(cursor, "MMMM yyyy")}
          </span>
          <button
            type="button"
            onClick={() => setCursor((c) => addMonths(c, 1))}
            className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800"
          >
            →
          </button>
        </div>
      </div>

      <div className="mb-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
        <p className="text-xs font-medium uppercase tracking-wide text-emerald-400/90">This month (estimated)</p>
        <p className="mt-1 text-2xl font-semibold tabular-nums text-emerald-300">
          ${(upcomingTotal / 100).toLocaleString("en-CA", { minimumFractionDigits: 2 })}
        </p>
      </div>

      <ul className="max-h-64 space-y-2 overflow-y-auto pr-1">
        {inMonth.length === 0 ? (
          <li className="rounded-lg border border-slate-800/80 bg-slate-900/40 px-3 py-4 text-sm text-slate-500">
            No estimated payouts in this month.
          </li>
        ) : (
          inMonth.map((p) => (
            <li
              key={p.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-2 text-sm"
            >
              <div>
                <p className="font-medium text-slate-200">{p.listingTitle}</p>
                <p className="text-xs text-slate-500">
                  Est. payout {format(p.payoutDate, "MMM d")} · Payment {p.status}
                </p>
              </div>
              <span className="font-semibold tabular-nums text-emerald-300">
                ${(p.amountCents / 100).toFixed(2)}
              </span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
