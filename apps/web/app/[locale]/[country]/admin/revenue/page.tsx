import Link from "next/link";
import { getRevenueSummary, getRevenueLedger } from "@/lib/revenue-intelligence";
import { getRevenueEngineDashboardStats, getTopRevenueUsers } from "@/src/modules/revenue/revenueEngine";
import { getMonetizationAdminSnapshot } from "@/lib/monetization/dashboard";
import { getPlatformPaymentMonetizationBreakdown } from "@/lib/revenue/platform-payment-breakdown";
import { prisma } from "@/lib/db";
import { getStripeConnectivityReadiness } from "@/lib/payment-readiness/stripe-env-readiness";
import { getUnifiedStripeCaptureSummary } from "@/lib/revenue/unified-capture-admin-stats";

export const dynamic = "force-dynamic";

function formatCents(cents: number): string {
  return `${cents.toLocaleString("en-CA")} ¢`;
}

export default async function AdminRevenuePage() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  const summary = await getRevenueSummary({ periodStart: start, periodEnd: end });
  const ledger = await getRevenueLedger({ periodStart: start, periodEnd: end, limit: 30 });
  const engineStats = await getRevenueEngineDashboardStats();
  const topRevenueUsers = await getTopRevenueUsers(12);
  const monetization = getMonetizationAdminSnapshot();
  const proj = monetization.projectedFromExampleCents;
  const platformSlices = await getPlatformPaymentMonetizationBreakdown();
  const stripeReadiness = getStripeConnectivityReadiness();
  const unifiedStripe = await getUnifiedStripeCaptureSummary(prisma).catch(() => ({
    totalCents30d: 0,
    bnhubCents30d: 0,
    nonBnhubCents30d: 0,
    prev7vsLast7GrowthPercent: null as number | null,
  }));

  return (
    <main className="bg-slate-950 text-slate-50">
      <section className="border-b border-slate-800 bg-slate-950/80">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-400">
            Revenue
          </p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
            Revenue intelligence
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-400">
            Platform ledger plus the monetization layer: tracked events, opportunities, and high-value user ranking.
          </p>
          <div className="mt-4 flex flex-wrap gap-4">
            <Link
              href="/admin"
              className="text-sm font-medium text-emerald-400 hover:text-emerald-300"
            >
              ← Back to Admin
            </Link>
            <Link href="/admin/revenue-engine-v4" className="text-sm font-medium text-amber-300/90 hover:text-amber-200">
              Revenue Engine v4 →
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-800 bg-slate-950/90">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <h2 className="text-lg font-semibold text-amber-200">$10K/month model (config + projection)</h2>
          <p className="mt-1 text-sm text-slate-400">
            Illustrative gross from configured rates — not live ledger. Pricing changes require product/legal sign-off.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-amber-900/40 bg-slate-900/60 p-4">
              <p className="text-xs font-medium uppercase text-slate-500">Booking fee %</p>
              <p className="mt-1 text-2xl font-semibold text-amber-200">
                {(monetization.pricing.bookingFeePercent * 100).toFixed(1)}%
              </p>
            </div>
            <div className="rounded-xl border border-amber-900/40 bg-slate-900/60 p-4">
              <p className="text-xs font-medium uppercase text-slate-500">Lead price (¢)</p>
              <p className="mt-1 text-2xl font-semibold text-amber-200">
                {monetization.pricing.leadPriceCents}
              </p>
            </div>
            <div className="rounded-xl border border-amber-900/40 bg-slate-900/60 p-4">
              <p className="text-xs font-medium uppercase text-slate-500">Featured slot (¢/mo)</p>
              <p className="mt-1 text-2xl font-semibold text-amber-200">
                {monetization.pricing.featuredListingPriceCents}
              </p>
            </div>
            <div className="rounded-xl border border-amber-900/40 bg-slate-900/60 p-4">
              <p className="text-xs font-medium uppercase text-slate-500">Example projection (¢)</p>
              <p className="mt-1 text-2xl font-semibold text-emerald-300">{proj.totalCents}</p>
              <p className="mt-1 text-xs text-slate-500">
                bookings {proj.bookingFeesCents} · leads {proj.leadsCents} · featured {proj.featuredCents}
              </p>
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500">{monetization.exampleModel.note}</p>
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-slate-300">Streams</h3>
            <ul className="mt-2 flex flex-wrap gap-2">
              {monetization.streams.map((s) => (
                <li
                  key={s.id}
                  className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-xs text-slate-300"
                >
                  {s.label}
                  {s.active ? "" : " (off)"}
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900/50 p-4">
            <h3 className="text-sm font-semibold text-rose-200/90">Risks</h3>
            <ul className="mt-2 list-inside list-disc text-sm text-slate-400">
              {monetization.risks.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-slate-300">{monetization.recommendation}</p>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-800 bg-slate-950/90">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <h2 className="text-lg font-semibold text-slate-200">Payment rails &amp; Stripe readiness</h2>
          <p className="mt-1 text-sm text-slate-500">
            Environment-only checks — no secret values are displayed. Enable{" "}
            <code className="text-slate-400">PAYMENTS_ENABLED=true</code> only after compliance sign-off and with{" "}
            <code className="text-slate-400">PRODUCTION_LOCK_MODE=true</code>.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <p className="text-xs font-medium uppercase text-slate-500">Secret key</p>
              <p className="mt-1 text-sm text-slate-200">{stripeReadiness.stripeSecretOk ? "Configured" : "Missing / invalid"}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <p className="text-xs font-medium uppercase text-slate-500">Webhook secret</p>
              <p className="mt-1 text-sm text-slate-200">{stripeReadiness.stripeWebhookSecretOk ? "Configured" : "Missing / invalid"}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <p className="text-xs font-medium uppercase text-slate-500">Connect (env flag)</p>
              <p className="mt-1 text-sm text-slate-200">
                {stripeReadiness.stripeConnectDeclared ? "STRIPE_CONNECT_ENABLED=true" : "Not declared (optional env)"}
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <p className="text-xs font-medium uppercase text-slate-500">Webhook URL (canonical)</p>
              <p className="mt-1 break-all font-mono text-xs text-slate-400">/api/stripe/webhook — alias /api/webhooks/stripe</p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-800 bg-slate-900/30">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <h2 className="text-lg font-semibold text-slate-200">Unified Stripe capture (30d)</h2>
          <p className="mt-1 text-sm text-slate-500">
            Idempotent rows on <code className="text-slate-400">platform_revenue_events</code> from Checkout + PaymentIntent
            webhooks (Stripe-hosted cards only).
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-emerald-900/40 bg-slate-900/60 p-4">
              <p className="text-xs font-medium uppercase text-slate-500">Total (30d)</p>
              <p className="mt-1 text-2xl font-semibold text-emerald-200">{formatCents(unifiedStripe.totalCents30d)}</p>
            </div>
            <div className="rounded-xl border border-sky-900/40 bg-slate-900/60 p-4">
              <p className="text-xs font-medium uppercase text-slate-500">BNHub-tagged</p>
              <p className="mt-1 text-2xl font-semibold text-sky-200">{formatCents(unifiedStripe.bnhubCents30d)}</p>
            </div>
            <div className="rounded-xl border border-amber-900/40 bg-slate-900/60 p-4">
              <p className="text-xs font-medium uppercase text-slate-500">Non-BNHub</p>
              <p className="mt-1 text-2xl font-semibold text-amber-200">{formatCents(unifiedStripe.nonBnhubCents30d)}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <p className="text-xs font-medium uppercase text-slate-500">7d vs prior 7d growth</p>
              <p className="mt-1 text-2xl font-semibold text-slate-100">
                {unifiedStripe.prev7vsLast7GrowthPercent == null
                  ? "—"
                  : `${unifiedStripe.prev7vsLast7GrowthPercent.toFixed(1)}%`}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-800 bg-slate-900/30">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <h2 className="text-lg font-semibold text-slate-200">Live Stripe checkout (platform payments)</h2>
          <p className="mt-1 text-sm text-slate-500">
            Paid <code className="text-slate-400">PlatformPayment</code> rows plus BNHUB booking{" "}
            <code className="text-slate-400">platformFeeCents</code> (completed payments).
          </p>
          <div className="mt-6 overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/80 text-left text-slate-400">
                  <th className="px-4 py-3 font-medium">Window</th>
                  <th className="px-4 py-3 font-medium text-right">Total</th>
                  <th className="px-4 py-3 font-medium text-right">Leads</th>
                  <th className="px-4 py-3 font-medium text-right">Bookings (fees)</th>
                  <th className="px-4 py-3 font-medium text-right">Featured</th>
                  <th className="px-4 py-3 font-medium text-right">Other</th>
                </tr>
              </thead>
              <tbody className="text-slate-200">
                {(
                  [
                    ["Today (UTC)", platformSlices.today],
                    ["Last 7 days", platformSlices.last7d],
                    ["Last 30 days", platformSlices.last30d],
                  ] as const
                ).map(([label, w]) => (
                  <tr key={label} className="border-b border-slate-800/80">
                    <td className="px-4 py-3">{label}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatCents(w.totalCents)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-emerald-300/90">{formatCents(w.leadsCents)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-sky-300/90">{formatCents(w.bookingsCents)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-amber-300/90">{formatCents(w.featuredCents)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-500">{formatCents(w.otherCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-800 bg-slate-900/40">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <h2 className="text-lg font-semibold text-emerald-200">Revenue engine (monetization layer)</h2>
          <p className="mt-1 text-sm text-slate-400">
            User-centric <code className="text-slate-300">RevenueEvent</code> rows and{" "}
            <code className="text-slate-300">RevenueOpportunity</code> funnel — drives CRM / Close Room ranking.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-xl border border-emerald-900/50 bg-slate-950/60 p-4">
              <p className="text-xs font-medium uppercase text-slate-500">Revenue today ($)</p>
              <p className="mt-1 text-2xl font-semibold text-emerald-300">
                {engineStats.revenueToday.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <p className="text-xs font-medium uppercase text-slate-500">Open opportunities</p>
              <p className="mt-1 text-2xl font-semibold text-slate-100">{engineStats.openOpportunities}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <p className="text-xs font-medium uppercase text-slate-500">Converted (30d)</p>
              <p className="mt-1 text-2xl font-semibold text-slate-100">{engineStats.convertedLast30d}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <p className="text-xs font-medium uppercase text-slate-500">Lost (30d)</p>
              <p className="mt-1 text-2xl font-semibold text-rose-300/90">{engineStats.lostLast30d}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <p className="text-xs font-medium uppercase text-slate-500">Opp. conversion rate</p>
              <p className="mt-1 text-2xl font-semibold text-amber-200/90">
                {(engineStats.opportunityConversionRate * 100).toFixed(1)}%
              </p>
            </div>
          </div>
          <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/50 p-4">
            <p className="text-xs font-semibold uppercase text-slate-500">Events today by type</p>
            <div className="mt-2 flex flex-wrap gap-3 text-sm text-slate-300">
              {Object.keys(engineStats.eventsTodayByType).length === 0 ? (
                <span className="text-slate-500">No events yet today.</span>
              ) : (
                Object.entries(engineStats.eventsTodayByType).map(([k, v]) => (
                  <span key={k} className="rounded-lg border border-slate-700 px-2 py-1 font-mono text-xs">
                    {k}: {v}
                  </span>
                ))
              )}
            </div>
          </div>
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-slate-200">Top revenue users</h3>
            <p className="mt-1 text-xs text-slate-500">
              Blends CRM <code className="text-slate-400">priorityScore</code> with open opportunity value and 30d
              realized revenue events.
            </p>
            {topRevenueUsers.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">No ranked users yet (needs linked leads / events).</p>
            ) : (
              <div className="mt-3 overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700 bg-slate-900/80">
                      <th className="px-4 py-2 text-left text-slate-400">User</th>
                      <th className="px-4 py-2 text-right text-slate-400">Composite</th>
                      <th className="px-4 py-2 text-right text-slate-400">Pri</th>
                      <th className="px-4 py-2 text-right text-slate-400">Open $</th>
                      <th className="px-4 py-2 text-right text-slate-400">Realized 30d</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topRevenueUsers.map((u) => (
                      <tr key={u.userId} className="border-b border-slate-800/80">
                        <td className="px-4 py-2 text-slate-200">
                          <div>{u.name ?? "—"}</div>
                          <div className="font-mono text-xs text-slate-500">{u.email}</div>
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums text-emerald-200/90">
                          {u.compositeScore.toFixed(1)}
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums">{u.priorityScore}</td>
                        <td className="px-4 py-2 text-right tabular-nums text-slate-300">
                          {u.openOpportunityValue.toFixed(0)}
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums text-slate-300">
                          {u.realizedRevenue30d.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <p className="mt-6 text-center text-xs font-medium tracking-wide text-emerald-500/90">
            LECIPM REVENUE ENGINE ACTIVE
          </p>
        </div>
      </section>

      <section className="border-b border-slate-800 bg-slate-950/90">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <h2 className="text-lg font-semibold text-slate-200">Summary (last 30 days)</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <p className="text-xs font-medium uppercase text-slate-500">Total revenue (cents)</p>
              <p className="mt-1 text-2xl font-semibold text-emerald-300">{summary.totalCents}</p>
            </div>
            {Object.entries(summary.byType).map(([type, cents]) => (
              <div key={type} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                <p className="text-xs font-medium uppercase text-slate-500">{type}</p>
                <p className="mt-1 text-2xl font-semibold text-slate-100">{cents}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-950/80">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <h2 className="text-lg font-semibold text-slate-200">Recent ledger entries</h2>
          {ledger.entries.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No entries in this period.</p>
          ) : (
            <div className="mt-4 overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-900/80">
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Type</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Entity</th>
                    <th className="px-4 py-3 text-right font-medium text-slate-400">Amount (¢)</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-400">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {ledger.entries.map((e) => (
                    <tr key={e.id} className="border-b border-slate-800/80">
                      <td className="px-4 py-3 text-slate-200">{e.type}</td>
                      <td className="px-4 py-3 text-slate-300">{e.entityType}:{e.entityId.slice(0, 8)}</td>
                      <td className="px-4 py-3 text-right text-slate-200">{e.amountCents}</td>
                      <td className="px-4 py-3 text-slate-500">
                        {new Date(e.createdAt).toISOString().slice(0, 10)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
