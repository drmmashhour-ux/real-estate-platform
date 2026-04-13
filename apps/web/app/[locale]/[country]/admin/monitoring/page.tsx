import Link from "next/link";
import { loadMonitoringSnapshot } from "@/lib/monitoring/load-monitoring-snapshot";
import type { MonitoringTimeRange, MonitoringLocaleFilter, MonitoringMarketFilter } from "@/lib/monitoring/types";
import { MonitoringExportButton } from "./monitoring-export-button";

export const dynamic = "force-dynamic";

function qp(
  base: Record<string, string | undefined>,
): Record<string, string | undefined> {
  const o: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(base)) {
    if (v !== undefined && v !== "all" && v !== "") o[k] = v;
  }
  return o;
}

function hrefFor(
  path: string,
  cur: { range: MonitoringTimeRange; locale: MonitoringLocaleFilter; market: MonitoringMarketFilter },
  patch: Partial<{ range: MonitoringTimeRange; locale: MonitoringLocaleFilter; market: MonitoringMarketFilter }>,
): string {
  const next = { ...cur, ...patch };
  const q = new URLSearchParams();
  q.set("range", next.range);
  if (next.locale !== "all") q.set("locale", next.locale);
  if (next.market !== "all") q.set("market", next.market);
  const s = q.toString();
  return s ? `${path}?${s}` : path;
}

export default async function AdminMonitoringPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = (await searchParams) ?? {};
  const range = (typeof sp.range === "string" ? sp.range : "7d") as MonitoringTimeRange;
  const locale = (typeof sp.locale === "string" ? sp.locale : "all") as MonitoringLocaleFilter;
  const market = (typeof sp.market === "string" ? sp.market : "all") as MonitoringMarketFilter;

  const safeRange: MonitoringTimeRange =
    range === "today" || range === "7d" || range === "30d" ? range : "7d";
  const safeLocale: MonitoringLocaleFilter =
    locale === "en" || locale === "fr" || locale === "ar" || locale === "all" ? locale : "all";
  const safeMarket: MonitoringMarketFilter =
    market === "syria" || market === "default" || market === "all" ? market : "all";

  const snap = await loadMonitoringSnapshot({
    range: safeRange,
    locale: safeLocale,
    market: safeMarket,
  });

  const cur = { range: safeRange, locale: safeLocale, market: safeMarket };

  const funnelMarketFiltered =
    safeMarket === "all"
      ? snap.markets.funnelMarketSignals
      : Object.fromEntries(
          Object.entries(snap.markets.funnelMarketSignals).filter(([k]) => {
            const low = k.toLowerCase();
            if (safeMarket === "syria") return low.includes("syria");
            return !low.includes("syria");
          }),
        );

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-50 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-400">Production</p>
        <h1 className="mt-2 text-2xl font-semibold">Operations monitoring</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-400">
          Bookings, Stripe, manual Syria-style settlements, locales (EN/FR/AR funnel signals), markets, AI/autopilot,
          notifications, and recorded server errors. Locale filter applies to growth funnel SQL slices; booking rows are
          global.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
          <Link href="/admin" className="text-emerald-400 hover:text-emerald-300">
            ← Admin home
          </Link>
          <Link href="/admin/bookings-ops" className="text-amber-400 hover:text-amber-300">
            Booking ops →
          </Link>
          <MonitoringExportButton snapshot={snap} />
        </div>

        <section className="mt-8 flex flex-wrap gap-2 text-xs">
          <span className="text-slate-500">Time:</span>
          {(["today", "7d", "30d"] as const).map((r) => (
            <Link
              key={r}
              href={hrefFor("/admin/monitoring", cur, { range: r })}
              className={`rounded-full px-3 py-1 ${safeRange === r ? "bg-sky-600 text-white" : "bg-white/10 text-slate-300 hover:bg-white/15"}`}
            >
              {r}
            </Link>
          ))}
          <span className="ml-4 text-slate-500">Locale:</span>
          {(["all", "en", "fr", "ar"] as const).map((l) => (
            <Link
              key={l}
              href={hrefFor("/admin/monitoring", cur, { locale: l })}
              className={`rounded-full px-3 py-1 ${safeLocale === l ? "bg-violet-600 text-white" : "bg-white/10 text-slate-300 hover:bg-white/15"}`}
            >
              {l}
            </Link>
          ))}
          <span className="ml-4 text-slate-500">Market (UI):</span>
          {(["all", "default", "syria"] as const).map((m) => (
            <Link
              key={m}
              href={hrefFor("/admin/monitoring", cur, { market: m })}
              className={`rounded-full px-3 py-1 ${safeMarket === m ? "bg-teal-600 text-white" : "bg-white/10 text-slate-300 hover:bg-white/15"}`}
            >
              {m}
            </Link>
          ))}
        </section>

        <section className="mt-10 rounded-xl border border-white/10 bg-slate-900/60 p-6">
          <h2 className="text-lg font-medium text-white">Pre-launch E2E signal</h2>
          <p className="mt-1 text-xs text-slate-500">
            From <code className="text-slate-400">e2e/reports/latest-run.json</code> after{" "}
            <code className="text-slate-400">pnpm test:e2e:launch</code>.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MiniStat label="Last run" value={snap.e2e.lastRunAt ?? "—"} />
            <MiniStat label="Pass rate" value={snap.e2e.scenarioPassRate != null ? `${snap.e2e.scenarioPassRate}%` : "—"} />
            <MiniStat label="Failed scenarios" value={String(snap.e2e.failedScenarioCount)} />
            <MiniStat label="Blocked" value={String(snap.e2e.blockedScenarioCount)} />
          </div>
          <p className="mt-4 text-sm">
            <span className="text-slate-400">Launch recommendation: </span>
            <strong className="text-white">{snap.e2e.recommendation.replace(/_/g, " ")}</strong>
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-medium text-white">
            Launch health score: <span className="text-sky-400">{snap.health.score}</span>/100
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {snap.health.subsystems.map((s) => (
              <div key={s.id} className="rounded-lg border border-white/10 bg-slate-900/40 p-4">
                <p className="text-xs uppercase text-slate-500">{s.label}</p>
                <p className={`mt-1 text-sm font-semibold ${trafficClass(s.traffic)}`}>{s.traffic.toUpperCase()}</p>
                <p className="mt-2 text-xs text-slate-400">{s.detail}</p>
              </div>
            ))}
          </div>
        </section>

        {snap.health.alerts.length > 0 && (
          <section className="mt-10">
            <h2 className="text-lg font-medium text-rose-200">Alerts</h2>
            <ul className="mt-3 space-y-2">
              {snap.health.alerts.map((a) => (
                <li
                  key={a.id}
                  className="rounded-lg border border-rose-500/30 bg-rose-950/30 px-4 py-3 text-sm text-rose-100"
                >
                  <span className="font-medium">{a.title}</span>{" "}
                  <span className="text-rose-200/80">({a.severity})</span>
                  <p className="mt-1 text-xs text-rose-200/70">{a.detail}</p>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-slate-900/50 p-5">
            <h3 className="font-medium text-white">Bookings</h3>
            <p className="mt-2 text-xs text-slate-500">Window: {snap.window.startIso.slice(0, 10)} → now</p>
            <ul className="mt-3 space-y-1 text-sm text-slate-300">
              <li>Created in range: {snap.bookings.createdInRange}</li>
              <li>Awaiting host (current): {snap.bookings.awaitingHostApproval}</li>
              <li>Manual PENDING: {snap.bookings.pendingManualSettlement}</li>
              <li>Cancellations in range: {snap.bookings.cancelledInRange}</li>
              <li>Stripe checkout payments (created in range): {snap.bookings.onlineStripeCheckoutPayments}</li>
              <li>Manual-tracked bookings: {snap.bookings.manualTrackedBookings}</li>
            </ul>
          </div>
          <div className="rounded-xl border border-white/10 bg-slate-900/50 p-5">
            <h3 className="font-medium text-white">Payments &amp; Stripe webhooks</h3>
            <ul className="mt-3 space-y-1 text-sm text-slate-300">
              <li>Payments created: {snap.payments.paymentsCreated}</li>
              <li>Completed / failed: {snap.payments.completed} / {snap.payments.failed}</li>
              <li>With Checkout session id: {snap.payments.withCheckoutSession}</li>
              <li>Webhook rows (growth log): {snap.payments.webhookEvents}</li>
            </ul>
          </div>
          <div className="rounded-xl border border-white/10 bg-slate-900/50 p-5">
            <h3 className="font-medium text-white">Locale funnel</h3>
            <ul className="mt-3 space-y-1 text-sm text-slate-300">
              <li>Language switched events: {snap.locales.languageSwitchedEvents}</li>
              {Object.entries(snap.locales.funnelEventsByLocale)
                .slice(0, 8)
                .map(([k, v]) => (
                  <li key={k}>
                    {k}: {v}
                  </li>
                ))}
            </ul>
          </div>
          <div className="rounded-xl border border-white/10 bg-slate-900/50 p-5">
            <h3 className="font-medium text-white">Market platform settings</h3>
            <ul className="mt-3 space-y-1 text-sm text-slate-300">
              <li>activeMarketCode: {snap.markets.platformActiveMarketCode ?? "—"}</li>
              <li>syriaModeEnabled: {String(snap.markets.syriaModeEnabled)}</li>
              <li>onlinePaymentsEnabled: {String(snap.markets.onlinePaymentsEnabled)}</li>
              <li>manualPaymentTrackingEnabled: {String(snap.markets.manualPaymentTrackingEnabled)}</li>
            </ul>
            <p className="mt-2 text-xs text-slate-500">market_mode_used signals (filtered by chip):</p>
            <ul className="text-xs text-slate-400">
              {Object.entries(funnelMarketFiltered).map(([k, v]) => (
                <li key={k}>
                  {k}: {v}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-white/10 bg-slate-900/50 p-5">
            <h3 className="font-medium text-white">AI / autopilot</h3>
            <ul className="mt-3 space-y-1 text-sm text-slate-300">
              <li>Recommendations created: {snap.ai.recommendationsCreated}</li>
              <li>Approvals pending / approved / rejected: {snap.ai.approvalPending} / {snap.ai.approvalApproved} / {snap.ai.approvalRejected}</li>
            </ul>
          </div>
          <div className="rounded-xl border border-white/10 bg-slate-900/50 p-5">
            <h3 className="font-medium text-white">Notifications &amp; errors</h3>
            <ul className="mt-3 space-y-1 text-sm text-slate-300">
              <li>Notifications created: {snap.notifications.notificationsCreated}</li>
              <li>ErrorEvent rows: {snap.errors.totalInRange}</li>
            </ul>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-medium text-white">Operations tables</h2>
          <h3 className="mt-4 text-sm font-medium text-slate-300">Bookings needing attention</h3>
          <div className="mt-2 overflow-x-auto rounded-lg border border-white/10">
            <table className="min-w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-500">
                <tr>
                  <th className="p-2">ID</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Manual</th>
                  <th className="p-2">Check-in</th>
                </tr>
              </thead>
              <tbody>
                {snap.bookings.attentionBookings.map((b) => (
                  <tr key={b.id} className="border-t border-white/5">
                    <td className="p-2 font-mono text-[10px]">{b.id.slice(0, 8)}…</td>
                    <td className="p-2">{b.status}</td>
                    <td className="p-2">{b.manualPaymentSettlement}</td>
                    <td className="p-2">{b.checkIn.slice(0, 10)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 className="mt-8 text-sm font-medium text-slate-300">Recent failed payments</h3>
          <div className="mt-2 overflow-x-auto rounded-lg border border-white/10">
            <table className="min-w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-500">
                <tr>
                  <th className="p-2">Payment</th>
                  <th className="p-2">Booking</th>
                  <th className="p-2">At</th>
                </tr>
              </thead>
              <tbody>
                {snap.payments.recentFailed.map((p) => (
                  <tr key={p.id} className="border-t border-white/5">
                    <td className="p-2 font-mono text-[10px]">{p.id.slice(0, 8)}…</td>
                    <td className="p-2 font-mono text-[10px]">{p.bookingId.slice(0, 8)}…</td>
                    <td className="p-2">{p.createdAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 className="mt-8 text-sm font-medium text-slate-300">Recent server errors (ErrorEvent)</h3>
          <div className="mt-2 overflow-x-auto rounded-lg border border-white/10">
            <table className="min-w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-500">
                <tr>
                  <th className="p-2">Type</th>
                  <th className="p-2">Route</th>
                  <th className="p-2">Message</th>
                  <th className="p-2">At</th>
                </tr>
              </thead>
              <tbody>
                {snap.errors.recent.map((e) => (
                  <tr key={e.id} className="border-t border-white/5">
                    <td className="p-2">{e.errorType}</td>
                    <td className="p-2">{e.route ?? "—"}</td>
                    <td className="p-2 max-w-md truncate">{e.message}</td>
                    <td className="p-2">{e.createdAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-slate-900/50 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 truncate text-sm font-medium text-white">{value}</p>
    </div>
  );
}

function trafficClass(t: string): string {
  if (t === "green") return "text-emerald-400";
  if (t === "yellow") return "text-amber-400";
  return "text-rose-400";
}
