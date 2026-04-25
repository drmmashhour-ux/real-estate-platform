import Link from "next/link";
import { redirect } from "next/navigation";
import { PaymentStatus } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

function cad(cents: number) {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);
}

export default async function AdminBnhubRevenuePage() {
  const guestId = await getGuestId();
  if (!guestId) redirect("/auth/login?next=/admin/revenue");
  if (!(await isPlatformAdmin(guestId))) redirect("/");

  const since = new Date();
  since.setDate(since.getDate() - 30);

  const [paidAgg, recentPaid, bookingCount30d, bookingCountAll] = await Promise.all([
    prisma.payment.aggregate({
      where: { status: PaymentStatus.COMPLETED },
      _sum: {
        amountCents: true,
        guestFeeCents: true,
        platformFeeCents: true,
      },
      _avg: { amountCents: true },
      _count: { _all: true },
    }),
    prisma.payment.findMany({
      where: { status: PaymentStatus.COMPLETED, paidAt: { gte: since } },
      orderBy: { paidAt: "desc" },
      take: 8,
      select: {
        amountCents: true,
        guestFeeCents: true,
        platformFeeCents: true,
        paidAt: true,
        bookingId: true,
      },
    }),
    prisma.booking.count({ where: { createdAt: { gte: since } } }),
    prisma.booking.count(),
  ]);

  const paidCount = paidAgg._count._all;
  const totalRevenueCents = paidAgg._sum.amountCents ?? 0;
  const guestFeesCents = paidAgg._sum.guestFeeCents ?? 0;
  const stripePlatformCents = paidAgg._sum.platformFeeCents ?? 0;
  const platformEarningsCents = stripePlatformCents > 0 ? stripePlatformCents : guestFeesCents;
  const avgBookingCents =
    paidCount > 0 && totalRevenueCents > 0 ? Math.round(totalRevenueCents / paidCount) : 0;

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-10 text-zinc-100 sm:px-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400/90">Admin</p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">BNHub booking revenue</h1>
          <p className="max-w-2xl text-sm text-zinc-400">
            Totals from completed Stripe checkouts (<code className="text-zinc-300">Payment.status = COMPLETED</code>
            ). Platform earnings use Stripe application fees when present; otherwise guest service fees.
          </p>
          <div className="flex flex-wrap gap-3 text-sm">
            <Link href="/admin/revenue-dashboard" className="text-amber-400 hover:text-amber-300">
              BNHub revenue dashboard →
            </Link>
            <Link href="/admin/bookings" className="text-zinc-400 hover:text-zinc-200">
              Bookings →
            </Link>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="Total bookings (all time)" value={String(bookingCountAll)} hint="All statuses" />
          <MetricCard label="Bookings (30 days)" value={String(bookingCount30d)} hint="Created in last 30d" />
          <MetricCard label="Paid checkouts" value={String(paidCount)} hint="Completed payments" />
          <MetricCard label="Avg paid total" value={cad(avgBookingCents)} hint="Per completed payment" />
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Guest volume</h2>
            <p className="mt-3 text-3xl font-semibold tabular-nums text-white">{cad(totalRevenueCents)}</p>
            <p className="mt-1 text-sm text-zinc-400">Sum of payment amounts (what guests paid).</p>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Platform earnings</h2>
            <p className="mt-3 text-3xl font-semibold tabular-nums text-amber-400">{cad(platformEarningsCents)}</p>
            <p className="mt-1 text-sm text-zinc-400">
              {stripePlatformCents > 0
                ? "Sum of recorded Stripe platform / application fees."
                : "Falls back to guest service fees on the Payment row."}
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Recent completed payments</h2>
          <p className="mt-1 text-xs text-zinc-500">Last 30 days</p>
          <ul className="mt-4 divide-y divide-zinc-800">
            {recentPaid.length === 0 ? (
              <li className="py-6 text-sm text-zinc-500">No completed payments in the last 30 days.</li>
            ) : (
              recentPaid.map((p) => (
                <li key={p.bookingId} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                  <span className="font-mono text-xs text-zinc-400">{p.bookingId.slice(0, 12)}…</span>
                  <span className="tabular-nums text-white">{cad(p.amountCents)}</span>
                  <span className="text-xs text-zinc-500">{p.paidAt?.toISOString().slice(0, 10) ?? "—"}</span>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}

function MetricCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
      <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-white">{value}</p>
      <p className="mt-1 text-xs text-zinc-500">{hint}</p>
    </div>
  );
}
