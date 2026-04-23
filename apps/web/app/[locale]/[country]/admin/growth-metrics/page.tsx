import Link from "next/link";
import { prisma } from "@repo/db";

export const dynamic = "force-dynamic";

const GROWTH_PREFIX = "growth:";

async function countGrowth(name: string, since: Date) {
  return prisma.launchEvent.count({
    where: {
      event: `${GROWTH_PREFIX}${name}`,
      createdAt: { gte: since },
    },
  });
}

async function uniqueGrowthUsers(name: string, since: Date) {
  const rows = await prisma.launchEvent.groupBy({
    by: ["userId"],
    where: {
      event: `${GROWTH_PREFIX}${name}`,
      createdAt: { gte: since },
      userId: { not: null },
    },
  });
  return rows.filter((r) => r.userId != null).length;
}

export default async function AdminGrowthMetricsPage() {
  const now = new Date();
  const d7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    signup7,
    signup30,
    listing7,
    listing30,
    view7,
    view30,
    bookStart7,
    bookStart30,
    bookDone7,
    bookDone30,
    ref7,
    ref30,
    usersSignup30,
  ] = await Promise.all([
    countGrowth("signup", d7),
    countGrowth("signup", d30),
    countGrowth("create_listing", d7),
    countGrowth("create_listing", d30),
    countGrowth("view_listing", d7),
    countGrowth("view_listing", d30),
    countGrowth("booking_start", d7),
    countGrowth("booking_start", d30),
    countGrowth("booking_complete", d7),
    countGrowth("booking_complete", d30),
    countGrowth("referral_signup", d7),
    countGrowth("referral_signup", d30),
    uniqueGrowthUsers("signup", d30),
  ]);

  const conv30 = bookStart30 > 0 ? ((bookDone30 / bookStart30) * 100).toFixed(1) : "—";

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-50 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">Growth engine</p>
        <h1 className="mt-2 text-2xl font-semibold">Launch metrics (real events)</h1>
        <p className="mt-2 text-sm text-slate-400">
          Counts from <code className="text-slate-500">launch_events</code> with prefix{" "}
          <code className="text-slate-500">{GROWTH_PREFIX}</code>. No fabricated totals.
        </p>
        <div className="mt-6">
          <Link href="/admin/growth" className="text-sm text-emerald-400 hover:text-emerald-300">
            ← Campaigns / launch-first
          </Link>
        </div>

        <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <MetricCard title="Signups (30d)" value={signup30} sub={`7d: ${signup7} · unique users: ${usersSignup30}`} />
          <MetricCard title="Listings created (30d)" value={listing30} sub={`7d: ${listing7}`} />
          <MetricCard title="Listing views (30d)" value={view30} sub={`7d: ${view7}`} />
          <MetricCard title="Booking starts (30d)" value={bookStart30} sub={`7d: ${bookStart7}`} />
          <MetricCard title="Booking completes (30d)" value={bookDone30} sub={`7d: ${bookDone7}`} />
          <MetricCard title="Referral signups (30d)" value={ref30} sub={`7d: ${ref7}`} />
        </section>

        <section className="mt-10 rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          <h2 className="text-lg font-medium text-white">Conversion (30d)</h2>
          <p className="mt-2 text-sm text-slate-400">
            Booking complete ÷ booking start = <span className="font-mono text-amber-200">{conv30}%</span>
          </p>
        </section>
      </div>
    </main>
  );
}

function MetricCard({ title, value, sub }: { title: string; value: number; sub: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{title}</p>
      <p className="mt-2 text-3xl font-bold text-white">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{sub}</p>
    </div>
  );
}
