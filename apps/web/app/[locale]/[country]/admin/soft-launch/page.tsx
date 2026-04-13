import Link from "next/link";
import { ListingStatus } from "@prisma/client";
import { LecipmControlShell } from "@/components/admin/LecipmControlShell";
import { getAdminRiskAlerts } from "@/lib/admin/control-center";
import { getAdminOverviewStats } from "@/lib/admin/get-admin-overview";
import { requireAdminControlUserId } from "@/lib/admin/guard";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

function cad(cents: number) {
  return (cents / 100).toLocaleString("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 });
}

export default async function AdminSoftLaunchPage() {
  await requireAdminControlUserId();

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const [overview, riskAlerts, users7d, bookings7d, revenue7d, launchRows, checkoutStarts, paySuccess, publishedStays] =
    await Promise.all([
      getAdminOverviewStats(),
      getAdminRiskAlerts(),
      prisma.user.count({ where: { createdAt: { gte: weekAgo } } }).catch(() => 0),
      prisma.booking.count({ where: { createdAt: { gte: weekAgo } } }).catch(() => 0),
      prisma.platformPayment
        .aggregate({
          where: { status: "paid", createdAt: { gte: weekAgo } },
          _sum: { amountCents: true },
        })
        .catch(() => ({ _sum: { amountCents: 0 } })),
      prisma.launchEvent
        .findMany({
          orderBy: { createdAt: "desc" },
          take: 25,
          select: { id: true, event: true, timestamp: true, payload: true },
        })
        .catch(() => []),
      prisma.launchEvent.count({ where: { event: "CHECKOUT_START" } }).catch(() => 0),
      prisma.launchEvent.count({ where: { event: "PAYMENT_SUCCESS" } }).catch(() => 0),
      prisma.shortTermListing
        .count({
          where: { listingStatus: ListingStatus.PUBLISHED },
        })
        .catch(() => 0),
    ]);

  const alerts = riskAlerts.map((r) => ({
    id: r.id,
    title: r.title,
    detail: r.detail,
    href: r.href,
    severity: r.severity,
  }));

  return (
    <LecipmControlShell alerts={alerts}>
      <div className="space-y-10">
        <div>
          <h1 className="text-2xl font-bold text-white">Soft launch &amp; growth</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Onboarding, inventory, traffic, bookings, and revenue — one checklist for going live with real users.
          </p>
        </div>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-zinc-800 bg-[#111] p-4">
            <p className="text-xs uppercase tracking-wide text-zinc-500">New users (7d)</p>
            <p className="mt-1 text-2xl font-bold text-white">{users7d.toLocaleString()}</p>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-[#111] p-4">
            <p className="text-xs uppercase tracking-wide text-zinc-500">Bookings (7d)</p>
            <p className="mt-1 text-2xl font-bold text-emerald-300">{bookings7d.toLocaleString()}</p>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-[#111] p-4">
            <p className="text-xs uppercase tracking-wide text-zinc-500">Platform revenue (7d)</p>
            <p className="mt-1 text-2xl font-bold text-white">{cad(revenue7d._sum.amountCents ?? 0)}</p>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-[#111] p-4">
            <p className="text-xs uppercase tracking-wide text-zinc-500">Published stays</p>
            <p className="mt-1 text-2xl font-bold text-white">{publishedStays.toLocaleString()}</p>
          </div>
        </section>

        {overview ? (
          <p className="text-sm text-zinc-400">
            All-time snapshot: {overview.totalUsers.toLocaleString()} users · {overview.totalBookings.toLocaleString()}{" "}
            bookings · {cad(overview.revenueMonthCents)} paid platform revenue (30d roll).
          </p>
        ) : null}

        <section className="rounded-2xl border border-zinc-800 bg-[#111] p-5">
          <h2 className="text-lg font-semibold text-white">1 — Inventory &amp; seeding</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Get listings live before you spend on traffic. Import leads, convert to stays, or add BNHUB inventory
            directly.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              href="/admin/acquisition/import"
              className="rounded-xl border border-zinc-700 bg-black/40 px-4 py-3 text-sm transition hover:border-zinc-500"
            >
              <span className="font-medium text-white">CSV import (leads)</span>
              <span className="mt-1 block text-xs text-zinc-500">Bulk rows → acquisition queue</span>
            </Link>
            <Link
              href="/admin/acquisition"
              className="rounded-xl border border-zinc-700 bg-black/40 px-4 py-3 text-sm transition hover:border-zinc-500"
            >
              <span className="font-medium text-white">Acquisition board</span>
              <span className="mt-1 block text-xs text-zinc-500">Review &amp; convert to stays</span>
            </Link>
            <Link
              href="/admin/listings/stays"
              className="rounded-xl border border-zinc-700 bg-black/40 px-4 py-3 text-sm transition hover:border-zinc-500"
            >
              <span className="font-medium text-white">Stays admin</span>
              <span className="mt-1 block text-xs text-zinc-500">Short-term inventory table</span>
            </Link>
            <Link
              href="/admin/listings/new"
              className="rounded-xl border border-zinc-700 bg-black/40 px-4 py-3 text-sm transition hover:border-zinc-500"
            >
              <span className="font-medium text-white">New listing (admin)</span>
              <span className="mt-1 block text-xs text-zinc-500">Create path for staff</span>
            </Link>
            <Link
              href="/bnhub/host/listings/new"
              className="rounded-xl border border-zinc-700 bg-black/40 px-4 py-3 text-sm transition hover:border-zinc-500"
            >
              <span className="font-medium text-white">Host wizard (BNHUB)</span>
              <span className="mt-1 block text-xs text-zinc-500">Guided stay listing for hosts</span>
            </Link>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-[#111] p-5">
          <h2 className="text-lg font-semibold text-white">2 — Tracking</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Client beacons send <code className="text-zinc-400">page_view</code> and product events; daily rows feed{" "}
            <code className="text-zinc-400">platform_analytics</code>. Use Analytics for charts and Launch for BNHUB funnel
            events.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/admin/analytics"
              className="rounded-xl border border-zinc-600 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-900"
            >
              Analytics →
            </Link>
            <Link
              href="/admin/organic-analytics"
              className="rounded-xl border border-zinc-600 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-900"
            >
              Organic analytics →
            </Link>
            <Link
              href="/admin/revenue-dashboard"
              className="rounded-xl border border-zinc-600 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-900"
            >
              Revenue dashboard →
            </Link>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-zinc-800 bg-black/30 px-3 py-2 text-center">
              <p className="text-[10px] uppercase text-zinc-500">Checkout started (all time)</p>
              <p className="text-xl font-semibold text-sky-300">{checkoutStarts}</p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-black/30 px-3 py-2 text-center">
              <p className="text-[10px] uppercase text-zinc-500">Payment success (all time)</p>
              <p className="text-xl font-semibold text-emerald-400">{paySuccess}</p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-black/30 px-3 py-2 text-center">
              <p className="text-[10px] uppercase text-zinc-500">Launch events (sample)</p>
              <p className="text-xl font-semibold text-zinc-200">{launchRows.length}</p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-[#111] p-5">
          <h2 className="text-lg font-semibold text-white">3 — Content &amp; conversion</h2>
          <p className="mt-1 text-sm text-zinc-500">Generate packs, review intelligence, then drive traffic to BNHUB stays.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Link
              href="/admin/content"
              className="rounded-xl border border-zinc-700 bg-black/40 px-4 py-3 text-sm transition hover:border-zinc-500"
            >
              <span className="font-medium text-white">Growth automation</span>
              <span className="mt-1 block text-xs text-zinc-500">Content jobs &amp; assets</span>
            </Link>
            <Link
              href="/admin/content-intelligence"
              className="rounded-xl border border-zinc-700 bg-black/40 px-4 py-3 text-sm transition hover:border-zinc-500"
            >
              <span className="font-medium text-white">Content intelligence</span>
              <span className="mt-1 block text-xs text-zinc-500">Performance &amp; recommendations</span>
            </Link>
            <Link
              href="/bnhub/stays"
              className="rounded-xl border border-zinc-700 bg-black/40 px-4 py-3 text-sm transition hover:border-zinc-500"
            >
              <span className="font-medium text-white">Public stays search</span>
              <span className="mt-1 block text-xs text-zinc-500">Guest booking entry point</span>
            </Link>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-[#111] p-5">
          <h2 className="text-lg font-semibold text-white">Recent launch events</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="border-b border-zinc-800 text-xs uppercase text-zinc-500">
                <tr>
                  <th className="py-2 pr-3">Event</th>
                  <th className="py-2 pr-3">Time</th>
                </tr>
              </thead>
              <tbody>
                {launchRows.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="py-6 text-center text-zinc-500">
                      No launch events recorded yet.
                    </td>
                  </tr>
                ) : (
                  launchRows.map((r) => (
                    <tr key={r.id} className="border-b border-zinc-800/80">
                      <td className="py-2 font-mono text-xs text-emerald-400">{r.event}</td>
                      <td className="py-2 text-xs text-zinc-400">{r.timestamp.toISOString().slice(0, 19)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </LecipmControlShell>
  );
}
