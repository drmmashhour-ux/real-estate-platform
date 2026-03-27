"use client";

import Link from "next/link";
import { BookingCalendar, type CalendarBookingRow } from "@/components/calendar/BookingCalendar";
import { PayoutCalendar } from "@/components/calendar/PayoutCalendar";

export function HostDashboardHub({
  bookings,
  totalEarningsCents,
  pendingPayoutCents,
  canManage,
}: {
  bookings: CalendarBookingRow[];
  totalEarningsCents: number;
  pendingPayoutCents: number;
  canManage: boolean;
}) {
  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Host hub</h1>
          <p className="mt-1 text-sm text-slate-500">
            Short-term rentals — calendar, payouts, and requests in one place.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/bnhub/host/dashboard"
            className="rounded-xl border border-slate-600 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800"
          >
            BNHub host dashboard
          </Link>
          <Link
            href="/dashboard/host/payouts"
            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
          >
            Payouts & Stripe
          </Link>
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Total earnings (paid)</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-emerald-300">
            ${(totalEarningsCents / 100).toLocaleString("en-CA", { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Pending host payouts</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-amber-300">
            ${(pendingPayoutCents / 100).toLocaleString("en-CA", { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Active bookings</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-white">
            {bookings.filter((b) => b.status === "CONFIRMED" || b.status === "AWAITING_HOST_APPROVAL").length}
          </p>
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <BookingCalendar bookings={bookings} canManage={canManage} />
        <PayoutCalendar bookings={bookings} />
      </div>

      <section className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5">
        <h2 className="text-base font-semibold text-white">Recent bookings</h2>
        <ul className="mt-4 divide-y divide-slate-800">
          {bookings.slice(0, 12).map((b) => (
            <li key={b.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
              <div>
                <p className="font-medium text-slate-200">{b.listing.title}</p>
                <p className="text-xs text-slate-500">
                  {b.guest.name ?? b.guest.email} · {b.status}
                </p>
              </div>
              <div className="text-right">
                <p className="tabular-nums text-slate-200">${(b.totalCents / 100).toFixed(2)}</p>
                <p className="text-xs text-slate-500">
                  Net ~$
                  {((b.payment?.hostPayoutCents ?? b.totalCents) / 100).toFixed(2)}
                </p>
              </div>
            </li>
          ))}
          {bookings.length === 0 && (
            <li className="py-8 text-center text-sm text-slate-500">No bookings yet. Publish a listing from BNHub.</li>
          )}
        </ul>
      </section>
    </div>
  );
}
