import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { prisma } from "@repo/db";
import { getCeoDashboardSnapshot } from "@/modules/ceo-dashboard/snapshot";

export const dynamic = "force-dynamic";

function fmtCad(cents: number): string {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(
    cents / 100
  );
}

export default async function AdminCeoDashboardPage() {
  const uid = await getGuestId();
  if (!uid || !(await isPlatformAdmin(uid))) redirect("/admin");

  const s = await getCeoDashboardSnapshot(prisma);
  const revDelta =
    s.netRevenueYesterdayCents != null
      ? s.revenueTodayCents - s.netRevenueYesterdayCents
      : null;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <section className="border-b border-slate-800 bg-slate-950/90">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400/90">Leadership</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">CEO dashboard</h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-400">
            Growth, revenue, user activity, and Close Room priorities — live from Prisma + executive metrics. Alerts flag
            activity drops, booking gaps, and weak pipeline conversion.
          </p>
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            <Link href="/admin/dashboard" className="font-medium text-emerald-400 hover:text-emerald-300">
              ← Control center
            </Link>
            <Link href="/admin/executive" className="text-slate-400 hover:text-slate-300">
              Executive Control
            </Link>
            <Link href="/admin/crm-live" className="text-slate-400 hover:text-slate-300">
              CRM Live / Close Room
            </Link>
            <Link href="/admin/revenue-dashboard" className="text-slate-400 hover:text-slate-300">
              BNHUB revenue
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-800 bg-slate-950/80">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Core metrics</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <MetricCard label="Total users" value={s.totalUsers} />
            <MetricCard label="Active users (7d)" value={s.activeUsers7d} hint="Profile touched in last 7 days" />
            <MetricCard label="Bookings (today)" value={s.bookingsToday} hint="Same window as executive snapshot" />
            <MetricCard label="Net revenue (today)" value={fmtCad(s.revenueTodayCents)} accent />
            <MetricCard
              label="Pipeline win rate (30d)"
              value={s.pipelineConversionPct != null ? `${s.pipelineConversionPct}%` : "—"}
              hint={`${s.wonLeads30d} won / ${s.newLeads30d} new leads`}
            />
          </div>
        </div>
      </section>

      <section className="border-b border-slate-800 bg-slate-950/90">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Revenue & opportunities</h2>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
              <p className="text-xs font-medium uppercase text-slate-500">Today (net)</p>
              <p className="mt-2 text-2xl font-semibold text-emerald-300">{fmtCad(s.revenueTodayCents)}</p>
              <p className="mt-1 text-xs text-slate-500">GMV {fmtCad(s.gmvTodayCents)}</p>
              {revDelta != null ? (
                <p className={`mt-2 text-xs ${revDelta >= 0 ? "text-emerald-400/90" : "text-amber-300/90"}`}>
                  vs yesterday net: {revDelta >= 0 ? "+" : ""}
                  {fmtCad(revDelta)}
                </p>
              ) : null}
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
              <p className="text-xs font-medium uppercase text-slate-500">Yesterday (net)</p>
              <p className="mt-2 text-2xl font-semibold text-slate-100">{fmtCad(s.netRevenueYesterdayCents ?? 0)}</p>
              <p className="mt-1 text-xs text-slate-500">{s.bookingsYesterday ?? 0} bookings (prior day)</p>
            </div>
            <div className="rounded-xl border border-amber-500/25 bg-amber-950/20 p-5">
              <p className="text-xs font-medium uppercase text-amber-200/80">Open opportunities</p>
              <p className="mt-2 text-2xl font-semibold text-amber-100">{s.openOpportunitiesCount}</p>
              <p className="mt-1 text-sm text-slate-400">
                Est. value ≈ {new Intl.NumberFormat(undefined, { style: "currency", currency: "CAD" }).format(s.openOpportunitiesValueSum)}
              </p>
              <Link href="/admin/revenue" className="mt-3 inline-block text-xs text-amber-300/90 underline">
                Revenue funnel →
              </Link>
            </div>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 text-sm text-slate-400">
              <span className="font-medium text-slate-300">Bookings rolling 7d:</span> {s.bookings7d}{" "}
              <span className="text-slate-600">|</span> prior 7d: {s.bookingsPrev7d}
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 text-sm text-slate-400">
              <span className="font-medium text-slate-300">Traffic events:</span> {s.trafficEvents24h} (24h) vs{" "}
              {s.trafficEventsPrev24h} (prev 24h)
            </div>
          </div>
        </div>
      </section>

      {s.alerts.length > 0 ? (
        <section className="border-b border-slate-800 bg-slate-950/80">
          <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-red-400/80">Alerts</h2>
            <ul className="mt-4 space-y-3">
              {s.alerts.map((a) => (
                <li
                  key={a.id}
                  className={`rounded-xl border px-4 py-3 text-sm ${
                    a.severity === "critical"
                      ? "border-red-500/50 bg-red-950/30 text-red-100"
                      : a.severity === "warn"
                        ? "border-amber-500/40 bg-amber-950/25 text-amber-100"
                        : "border-slate-600 bg-slate-900/50 text-slate-200"
                  }`}
                >
                  <p className="font-semibold">{a.title}</p>
                  <p className="mt-1 text-xs opacity-90">{a.detail}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <section className="bg-slate-950/90">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Close Room — top priorities</h2>
              <p className="mt-1 text-xs text-slate-500">
                Same queue as CRM Live: <code className="text-slate-400">getTopPriorityLeads</code> (priority + open revenue).
              </p>
            </div>
            <Link href="/admin/crm-live" className="text-xs font-medium text-emerald-400 hover:text-emerald-300">
              Open full queue →
            </Link>
          </div>
          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/80 text-xs uppercase text-slate-500">
                  <th className="px-3 py-2">Lead</th>
                  <th className="px-3 py-2">Intent</th>
                  <th className="px-3 py-2">Stage</th>
                  <th className="px-3 py-2">Next action</th>
                  <th className="px-3 py-2 text-right">Rank</th>
                  <th className="px-3 py-2 text-right">Rev ~</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {s.closeRoomTop.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-8 text-center text-slate-500">
                      No leads in queue (or all closed).
                    </td>
                  </tr>
                ) : (
                  s.closeRoomTop.map((row) => (
                    <tr key={row.id} className="border-b border-slate-800/80 hover:bg-slate-900/40">
                      <td className="px-3 py-2">
                        <p className="font-medium text-white">{row.name}</p>
                        <p className="text-xs text-slate-500">{row.email}</p>
                      </td>
                      <td className="px-3 py-2 text-slate-300">{row.intentScore}</td>
                      <td className="px-3 py-2 text-slate-300">{row.executionStage}</td>
                      <td className="max-w-[200px] truncate px-3 py-2 text-xs text-slate-400">{row.nextBestAction ?? "—"}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-amber-200/90">{Math.round(row.monetizationRank)}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-slate-400">{row.openRevenueValue.toFixed(0)}</td>
                      <td className="px-3 py-2">
                        <Link href={`/dashboard/leads/${row.id}`} className="text-xs text-emerald-400 hover:underline">
                          CRM
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <p className="mt-10 text-center text-xs font-medium tracking-[0.22em] text-emerald-400/90">
            LECIPM CEO MODE ACTIVE
          </p>
        </div>
      </section>
    </main>
  );
}

function MetricCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string | number;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <p className="text-xs font-medium uppercase text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${accent ? "text-emerald-300" : "text-slate-100"}`}>{value}</p>
      {hint ? <p className="mt-1 text-[11px] text-slate-600">{hint}</p> : null}
    </div>
  );
}
