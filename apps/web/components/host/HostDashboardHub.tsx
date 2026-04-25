"use client";

import Link from "next/link";
import { BookingCalendar, type CalendarBookingRow } from "@/components/calendar/BookingCalendar";
import { PayoutCalendar } from "@/components/calendar/PayoutCalendar";
import { HostStripeConnectCta } from "@/components/host/HostStripeConnectCta";
import { HostConversionInsights } from "@/components/host/HostConversionInsights";
import { HostReputationScore } from "@/components/host/HostReputationScore";
import type { ListingConversionInsight } from "@/lib/ai/conversion/conversion-types";
import type { HostReputationResult } from "@/lib/ai/reputation/reputation-types";
import { HostAutopilotEvaluatePanel } from "@/components/host/HostAutopilotEvaluatePanel";

export function HostDashboardHub({
  bookings,
  totalEarningsCents,
  pendingPayoutCents,
  canManage,
  stripeAccountId = null,
  stripeOnboardingComplete = false,
  conversionInsights = [],
  hostReputation = null,
  listingRefs = [],
}: {
  bookings: CalendarBookingRow[];
  totalEarningsCents: number;
  pendingPayoutCents: number;
  canManage: boolean;
  stripeAccountId?: string | null;
  stripeOnboardingComplete?: boolean;
  conversionInsights?: ListingConversionInsight[];
  hostReputation?: HostReputationResult | null;
  /** BNHUB listing codes for support, payouts, and wire references */
  listingRefs?: { id: string; title: string; listingCode: string }[];
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
            BNHUB host dashboard
          </Link>
          <Link
            href="/dashboard/host/analytics"
            className="rounded-xl border border-sky-500/40 px-4 py-2 text-sm font-medium text-sky-200 hover:bg-sky-950/40"
          >
            Revenue analytics
          </Link>
          <Link
            href="/dashboard/host/payouts"
            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
          >
            Payouts & Stripe
          </Link>
          <Link
            href="/dashboard/host/autopilot"
            className="rounded-xl border border-amber-500/50 px-4 py-2 text-sm font-medium text-amber-200 hover:bg-amber-950/40"
          >
            AI Autopilot
          </Link>
          <Link
            href="/dashboard/host/settings/autopilot"
            className="rounded-xl border border-slate-600 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800"
          >
            Autopilot settings
          </Link>
        </div>
      </div>

      {conversionInsights.length > 0 ? <HostConversionInsights insights={conversionInsights} /> : null}

      <HostAutopilotEvaluatePanel />

      {hostReputation ? <HostReputationScore data={hostReputation} /> : null}

      {listingRefs.length > 0 ? (
        <section className="rounded-2xl border border-emerald-500/25 bg-emerald-950/20 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-400/90">
            Host reference codes
          </p>
          <p className="mt-1 text-sm text-slate-400">
            Quote your public listing code when you contact support or match bank transfers. Internal listing ID is the
            stable UUID for accounting.
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            {listingRefs.map((l) => (
              <li
                key={l.id}
                className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg border border-slate-800/80 bg-slate-950/50 px-3 py-2"
              >
                <span className="font-medium text-slate-200">{l.title}</span>
                <span className="font-mono text-xs text-emerald-300">
                  {l.listingCode}
                  <span className="ml-2 text-slate-500">· id {l.id.slice(0, 8)}…</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-slate-600">
            Notifications for approvals and reminders appear in{" "}
            <Link href="/dashboard/notifications" className="text-emerald-400 hover:text-emerald-300">
              dashboard notifications
            </Link>
            .
          </p>
        </section>
      ) : null}

      <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Stripe payouts</p>
        <HostStripeConnectCta
          initialHasAccount={Boolean(stripeAccountId)}
          initialOnboardingComplete={Boolean(stripeOnboardingComplete)}
          showSetupButton
          className="mt-2"
        />
        <p className="mt-2 text-xs text-slate-600">
          Full history and fees:{" "}
          <Link href="/dashboard/host/payouts" className="text-emerald-400 hover:text-emerald-300">
            Payouts &amp; Stripe
          </Link>
        </p>
      </section>

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
            <li className="py-8 text-center text-sm text-slate-500">No bookings yet. Publish a listing from BNHUB.</li>
          )}
        </ul>
      </section>
    </div>
  );
}
