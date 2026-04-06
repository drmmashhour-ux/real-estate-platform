import Link from "next/link";
import { PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  getOrchestratedPaymentDelegate,
  getOrchestratedPayoutDelegate,
} from "@/lib/admin/prisma-orchestration-delegates";
import { KPICards } from "@/components/admin/KPICards";
import { MonetizationConversionFeedClient } from "@/components/admin/MonetizationConversionFeedClient";
import {
  MonetizationLedgerTable,
  type MonetizationLedgerRow,
} from "@/components/admin/MonetizationLedgerTable";
import { AdminPlatformShortcuts } from "@/components/admin/AdminPlatformShortcuts";

export const dynamic = "force-dynamic";

type PageProps = { searchParams?: Promise<{ provider?: string }> };

const CONVERSION_EVENTS = [
  "CHECKOUT_START",
  "CHECKOUT_BLOCKED",
  "CHECKOUT_SUCCESS",
  "CHECKOUT_FAILED",
  "CHECKOUT_EXPIRED",
  "PAYMENT_SUCCESS",
  "PAYMENT_FAILED",
  "PAYMENT_REFUNDED",
  "PAYMENT_AUDIT",
];

export default async function AdminMonetizationPage({ searchParams }: PageProps) {
  const sp = (await searchParams) ?? {};
  const providerFilter = sp.provider?.trim().toLowerCase();

  // Server component: rolling 30d window for dashboard queries.
  // eslint-disable-next-line react-hooks/purity -- time window is intentional per request
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const orchPay = getOrchestratedPaymentDelegate();
  const orchPayout = getOrchestratedPayoutDelegate();

  const [
    paidPlatformSum,
    paidPlatformCount,
    paidPlatformSumAllTime,
    paidPlatformCountAllTime,
    brokerLeadPaidCount,
    brokerPaymentSuccessSum,
    brokerPaymentSuccessSumAllTime,
    pendingBnhubPayments,
    bookingsPendingNoPaymentRow,
    refundLedgerRows,
    conversionRows,
    orchestratedCount30d,
    orchestratedSucceededSum30d,
    orchestratedFailedTotal,
    orchestratedPayoutScheduled,
    orchestratedPayoutFailed,
    orchestratedTimeline,
    bookingsCount30d,
    publishedListingsCount,
  ] = await Promise.all([
    prisma.platformPayment
      .aggregate({
        where: { status: "paid", createdAt: { gte: since } },
        _sum: { amountCents: true },
      })
      .catch(() => ({ _sum: { amountCents: null as number | null } })),
    prisma.platformPayment
      .count({ where: { status: "paid", createdAt: { gte: since } } })
      .catch(() => 0),
    prisma.platformPayment
      .aggregate({
        where: { status: "paid" },
        _sum: { amountCents: true },
      })
      .catch(() => ({ _sum: { amountCents: null as number | null } })),
    prisma.platformPayment.count({ where: { status: "paid" } }).catch(() => 0),
    prisma.brokerLead.count({ where: { billingStatus: "paid", updatedAt: { gte: since } } }).catch(() => 0),
    prisma.brokerPayment
      .aggregate({
        where: { status: "success", createdAt: { gte: since } },
        _sum: { amount: true },
      })
      .catch(() => ({ _sum: { amount: null as number | null } })),
    prisma.brokerPayment
      .aggregate({
        where: { status: "success" },
        _sum: { amount: true },
      })
      .catch(() => ({ _sum: { amount: null as number | null } })),
    prisma.payment.count({ where: { status: PaymentStatus.PENDING } }).catch(() => 0),
    prisma.booking.count({ where: { status: "PENDING", payment: { is: null } } }).catch(() => 0),
    prisma.stripeLedgerEntry
      .count({
        where: { status: "refunded", createdAt: { gte: since } },
      })
      .catch(() => 0),
    prisma.launchEvent
      .findMany({
        where: { event: { in: CONVERSION_EVENTS }, createdAt: { gte: since } },
        orderBy: { createdAt: "desc" },
        take: 80,
        select: { id: true, event: true, payload: true, timestamp: true, createdAt: true },
      })
      .catch(() => [] as { id: string; event: string; payload: unknown; timestamp: Date; createdAt: Date }[]),
    orchPay
      ? orchPay
          .count({
            where: {
              createdAt: { gte: since },
              ...(providerFilter === "stripe" || providerFilter === "clover" ? { provider: providerFilter } : {}),
            },
          })
          .catch(() => 0)
      : Promise.resolve(0),
    orchPay
      ? orchPay
          .aggregate({
            where: {
              status: "succeeded",
              createdAt: { gte: since },
              ...(providerFilter === "stripe" || providerFilter === "clover" ? { provider: providerFilter } : {}),
            },
            _sum: { amountCents: true },
          })
          .catch(() => ({ _sum: { amountCents: null as number | null } }))
      : Promise.resolve({ _sum: { amountCents: null as number | null } }),
    orchPay ? orchPay.count({ where: { status: "failed" } }).catch(() => 0) : Promise.resolve(0),
    orchPayout ? orchPayout.count({ where: { status: "scheduled" } }).catch(() => 0) : Promise.resolve(0),
    orchPayout ? orchPayout.count({ where: { status: "failed" } }).catch(() => 0) : Promise.resolve(0),
    orchPay
      ? orchPay
          .findMany({
            where: {
              createdAt: { gte: since },
              ...(providerFilter === "stripe" || providerFilter === "clover" ? { provider: providerFilter } : {}),
            },
            orderBy: { createdAt: "desc" },
            take: 25,
            select: {
              id: true,
              userId: true,
              bookingId: true,
              provider: true,
              paymentType: true,
              amountCents: true,
              status: true,
              createdAt: true,
              user: { select: { email: true } },
            },
          })
          .catch(
            () =>
              [] as {
                id: string;
                userId: string;
                bookingId: string | null;
                provider: string;
                paymentType: string;
                amountCents: number;
                status: string;
                createdAt: Date;
                user: { email: string | null } | null;
              }[]
          )
      : Promise.resolve(
          [] as {
            id: string;
            userId: string;
            bookingId: string | null;
            provider: string;
            paymentType: string;
            amountCents: number;
            status: string;
            createdAt: Date;
            user: { email: string | null } | null;
          }[]
        ),
    prisma.booking.count({ where: { createdAt: { gte: since } } }).catch(() => 0),
    prisma.shortTermListing.count({ where: { listingStatus: "PUBLISHED" } }).catch(() => 0),
  ]);

  const revenuePlatformCad = (paidPlatformSum._sum.amountCents ?? 0) / 100;
  const revenueBrokerCad = brokerPaymentSuccessSum._sum.amount ?? 0;
  const revenuePlatformAllCad = (paidPlatformSumAllTime._sum.amountCents ?? 0) / 100;
  const revenueBrokerAllCad = brokerPaymentSuccessSumAllTime._sum.amount ?? 0;
  const totalRevenueAllCad = revenuePlatformAllCad + revenueBrokerAllCad;
  const pendingPaymentsTotal = pendingBnhubPayments + bookingsPendingNoPaymentRow;
  const hasSuccessfulPayments =
    (paidPlatformSumAllTime._sum.amountCents ?? 0) > 0 || (brokerPaymentSuccessSumAllTime._sum.amount ?? 0) > 0;
  const checkoutStarts = conversionRows.filter((r) => r.event === "CHECKOUT_START").length;
  const checkoutSuccesses = conversionRows.filter((r) => r.event === "CHECKOUT_SUCCESS").length;
  const failedOrExpired =
    conversionRows.filter((r) => r.event === "CHECKOUT_FAILED" || r.event === "CHECKOUT_EXPIRED").length;

  const orchestratedRevenue30dCad = (orchestratedSucceededSum30d._sum.amountCents ?? 0) / 100;
  const revenue30dCad = revenuePlatformCad + revenueBrokerCad + orchestratedRevenue30dCad;
  const conversionRateLabel =
    checkoutStarts > 0 ? `${((checkoutSuccesses / checkoutStarts) * 100).toFixed(1)}%` : "—";

  const kpiItems = [
    { label: "Revenue (30D)", value: `$${revenue30dCad.toFixed(2)} CAD` },
    {
      label: "Bookings (30D)",
      value: String(bookingsCount30d),
      href: "/admin/bookings",
    },
    { label: "Conversion (sample)", value: conversionRateLabel },
    {
      label: "Published listings",
      value: String(publishedListingsCount),
      href: "/admin/listings",
    },
  ];

  const bookingIdsForPayouts = [
    ...new Set(orchestratedTimeline.map((r) => r.bookingId).filter((b): b is string => Boolean(b))),
  ];
  const payoutsForBookings =
    orchPayout && bookingIdsForPayouts.length > 0
      ? await orchPayout
          .findMany({
            where: { bookingId: { in: bookingIdsForPayouts } },
            select: { bookingId: true, status: true, scheduledAt: true, providerRef: true },
          })
          .catch(() => [] as { bookingId: string | null; status: string; scheduledAt: Date | null; providerRef: string | null }[])
      : [];
  const payoutByBooking = new Map(
    payoutsForBookings.filter((p) => p.bookingId).map((p) => [p.bookingId as string, p])
  );

  const ledgerRows: MonetizationLedgerRow[] = orchestratedTimeline.map((r) => {
    const email = r.user?.email?.trim();
    const userLabel = email || `${r.userId.slice(0, 8)}…`;
    const p = r.bookingId ? payoutByBooking.get(r.bookingId) : undefined;
    const payoutStatus = p ? `${p.status}${p.providerRef ? " · tr" : ""}` : "—";
    const timelineParts = [`Payment ${r.status} @ ${r.createdAt.toISOString().slice(0, 16)}Z`];
    if (r.bookingId) timelineParts.push(`booking …${r.bookingId.slice(-8)}`);
    if (p) {
      timelineParts.push(`→ payout ${p.status}`);
      if (p.scheduledAt) timelineParts.push(`scheduled ${p.scheduledAt.toISOString().slice(0, 10)}`);
      if (p.providerRef) timelineParts.push(`transfer ${p.providerRef.slice(0, 14)}…`);
    } else if (r.bookingId) {
      timelineParts.push("→ payout not scheduled");
    } else {
      timelineParts.push("→ payout n/a (no booking link)");
    }

    return {
      id: r.id,
      createdAtIso: r.createdAt.toISOString(),
      provider: r.provider,
      paymentStatus: r.status,
      payoutStatus,
      userLabel,
      amount: `${(r.amountCents / 100).toFixed(2)} CAD`,
      timeline: timelineParts.join(" "),
      detail: {
        id: r.id,
        userId: r.userId,
        userEmail: email ?? null,
        bookingId: r.bookingId,
        provider: r.provider,
        paymentType: r.paymentType,
        amountCents: r.amountCents,
        paymentStatus: r.status,
        payout: p ?? null,
        createdAt: r.createdAt.toISOString(),
      },
    };
  });

  const conversionFeedRows = conversionRows.map((r) => ({
    id: r.id,
    event: r.event,
    createdAtIso: r.createdAt.toISOString(),
    payload: r.payload,
  }));

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      <div className="mx-auto max-w-6xl">
        <h1 className="font-serif text-2xl text-white">Monetization</h1>
        <p className="mt-1 text-sm text-slate-400">
          Revenue and funnel from paid platform rows, BNHub payments, and launch_events — no Connect required for these
          counts.
        </p>

        <AdminPlatformShortcuts variant="monetization" />

        <div className="mt-8">
          <KPICards items={kpiItems} />
        </div>

        {!hasSuccessfulPayments ? (
          <div
            className="mt-6 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100/95"
            role="status"
          >
            No payments yet — waiting for Stripe validation
          </div>
        ) : null}

        <div className="mt-8 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
              Multi-provider orchestration (Stripe + Clover)
            </h2>
            <div className="flex flex-wrap gap-2 text-xs">
              <Link
                href="/admin/monetization"
                className={`rounded-lg px-3 py-1 ${!providerFilter ? "bg-emerald-600/30 text-emerald-200" : "bg-slate-800 text-slate-400 hover:text-white"}`}
              >
                All providers
              </Link>
              <Link
                href="/admin/monetization?provider=stripe"
                className={`rounded-lg px-3 py-1 ${providerFilter === "stripe" ? "bg-emerald-600/30 text-emerald-200" : "bg-slate-800 text-slate-400 hover:text-white"}`}
              >
                Stripe
              </Link>
              <Link
                href="/admin/monetization?provider=clover"
                className={`rounded-lg px-3 py-1 ${providerFilter === "clover" ? "bg-emerald-600/30 text-emerald-200" : "bg-slate-800 text-slate-400 hover:text-white"}`}
              >
                Clover
              </Link>
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            `orchestrated_payments` / `orchestrated_payouts` — complements legacy BNHub `payments` rows.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
              <p className="text-xs uppercase text-slate-500">Orchestrated volume (30D)</p>
              <p className="mt-1 text-xl font-semibold text-white">{orchestratedCount30d}</p>
              <p className="text-xs text-slate-500">sessions created</p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
              <p className="text-xs uppercase text-slate-500">Succeeded (30D)</p>
              <p className="mt-1 text-xl font-semibold text-emerald-300">${orchestratedRevenue30dCad.toFixed(2)} CAD</p>
              <p className="text-xs text-slate-500">gross from orchestration ledger</p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
              <p className="text-xs uppercase text-slate-500">Failed (all time)</p>
              <p className="mt-1 text-xl font-semibold text-rose-300">{orchestratedFailedTotal}</p>
              <p className="text-xs text-slate-500">orchestrated_payments.status = failed</p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
              <p className="text-xs uppercase text-slate-500">Payouts</p>
              <p className="mt-1 text-lg text-amber-200">
                {orchestratedPayoutScheduled} scheduled · {orchestratedPayoutFailed} failed
              </p>
              <p className="text-xs text-slate-500">Stripe Connect transfers</p>
            </div>
          </div>
          <MonetizationLedgerTable
            rows={ledgerRows}
            emptyMessage="No orchestrated payments in range. Data will appear after first transaction."
          />
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-xs uppercase tracking-wider text-slate-500">Total revenue (from payments)</p>
            <p className="mt-1 text-2xl font-semibold text-emerald-400">${totalRevenueAllCad.toFixed(2)} CAD</p>
            <p className="mt-1 text-xs text-slate-500">
              All time: {paidPlatformCountAllTime} platform payments + broker Stripe successes (see breakdown below).
            </p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-xs uppercase tracking-wider text-slate-500">Pending payments</p>
            <p className="mt-1 text-2xl font-semibold text-amber-300">{pendingPaymentsTotal}</p>
            <p className="mt-1 text-xs text-slate-500">
              BNHub payment rows still PENDING ({pendingBnhubPayments}) plus PENDING bookings with no payment row yet (
              {bookingsPendingNoPaymentRow}).
            </p>
          </div>
        </div>

        <h2 className="mt-10 text-sm font-semibold uppercase tracking-wide text-slate-400">Last 30D</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-xs uppercase tracking-wider text-slate-500">Platform revenue (paid)</p>
            <p className="mt-1 text-2xl font-semibold text-emerald-400">${revenuePlatformCad.toFixed(2)} CAD</p>
            <p className="mt-1 text-xs text-slate-500">{paidPlatformCount} payments</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-xs uppercase tracking-wider text-slate-500">Broker lead payments</p>
            <p className="mt-1 text-2xl font-semibold text-amber-300">${revenueBrokerCad.toFixed(2)} CAD</p>
            <p className="mt-1 text-xs text-slate-500">{brokerLeadPaidCount} leads marked paid</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-xs uppercase tracking-wider text-slate-500">Checkout funnel</p>
            <p className="mt-1 text-lg text-white">
              {checkoutSuccesses} / {checkoutStarts || "—"} success
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Failures + expired (sample): {failedOrExpired} events in feed
            </p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-xs uppercase tracking-wider text-slate-500">Refunds (ledger)</p>
            <p className="mt-1 text-2xl font-semibold text-rose-300">{refundLedgerRows}</p>
            <p className="mt-1 text-xs text-slate-500">Stripe refund rows (30D)</p>
          </div>
        </div>

        <h2 className="mt-10 text-sm font-semibold uppercase tracking-wide text-slate-400">Conversion feed</h2>
        <p className="mt-1 text-xs text-slate-500">Last 30D — open payloads in drawer (Escape to close).</p>
        <div className="mt-4">
          <MonetizationConversionFeedClient
            rows={conversionFeedRows}
            emptyMessage="No conversion events in range (ensure migrations + webhook deliver to LaunchEvent)."
          />
        </div>
      </div>
    </div>
  );
}
