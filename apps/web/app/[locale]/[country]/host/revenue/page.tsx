import Link from "next/link";
import { BnhubInvestorReportDownloadButton } from "@/components/bnhub/host/BnhubInvestorReportDownloadButton";
import { getGuestId } from "@/lib/auth/session";
import { detectRevenueAnomalies } from "@/modules/bnhub-revenue/bnhub-revenue-anomaly.service";
import { getRevenueDashboardSummary } from "@/modules/bnhub-revenue/bnhub-revenue-dashboard.service";
import { getDailyRevenueTrend } from "@/modules/bnhub-revenue/bnhub-revenue-trend.service";
import { getPricingImpactSummary } from "@/modules/bnhub-revenue/bnhub-pricing-impact.service";
import { generateHostRevenueNarrative } from "@/modules/revenue/narrative/narrative-generator.service";

export const dynamic = "force-dynamic";

const GOLD = "#D4AF37";

function formatMoney(currencyCode: string, value: number) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: currencyCode.length === 3 ? currencyCode : "USD",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function percentRatio(r: number) {
  return `${Math.round(Math.min(1, Math.max(0, r)) * 100)}%`;
}

export default async function HostBnhubRevenueDashboardPage() {
  const hostId = await getGuestId();
  if (!hostId) {
    return (
      <div className="p-6 text-zinc-400">
        <p>Sign in to view BNHub revenue analytics.</p>
      </div>
    );
  }

  const settled = await Promise.allSettled([
    getRevenueDashboardSummary(hostId),
    getDailyRevenueTrend(hostId, 30),
    getPricingImpactSummary(hostId),
    detectRevenueAnomalies(hostId),
    generateHostRevenueNarrative(hostId),
  ]);

  const summary = settled[0].status === "fulfilled" ? settled[0].value : null;
  const trend = settled[1].status === "fulfilled" ? settled[1].value : [];
  const pricingImpact = settled[2].status === "fulfilled" ? settled[2].value : null;
  const anomalies = settled[3].status === "fulfilled" ? settled[3].value : [];
  const narrative = settled[4].status === "fulfilled" ? settled[4].value : null;

  const widgetErrors = settled
    .map((r, i) => (r.status === "rejected" ? { i, reason: String(r.reason) } : null))
    .filter(Boolean) as { i: number; reason: string }[];

  const portfolio = summary?.portfolio;
  const cur = portfolio?.displayCurrency ?? "USD";

  return (
    <div className="space-y-10 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Revenue dashboard</h1>
          <p className="mt-1 text-sm text-zinc-500">
            KPIs from BNHub <code className="font-mono text-zinc-400">Booking</code> rows (UTC windows). Trend panel uses
            booking <strong>creation</strong> dates; headline KPIs use check-in dates in the last 30 UTC days (inclusive).
          </p>
          <p className="mt-2 text-xs text-zinc-600">
            Read-only — no payouts or listing edits here.{" "}
            <Link href="/bnhub/host/revenue-insights" className="underline" style={{ color: GOLD }}>
              Legacy revenue insights
            </Link>
          </p>
        </div>
        <div className="shrink-0">
          <BnhubInvestorReportDownloadButton />
          <p className="mt-2 max-w-[14rem] text-[10px] leading-snug text-zinc-600">
            Same KPIs as this dashboard; PDF uses Python ReportLab on the server.
          </p>
        </div>
      </div>

      {widgetErrors.length > 0 ? (
        <div className="rounded-xl border border-amber-900/40 bg-amber-950/30 px-4 py-3 text-xs text-amber-200/90">
          Some widgets failed to load; others below are still shown.
          <ul className="mt-2 list-inside list-disc text-amber-100/80">
            {widgetErrors.map((e) => (
              <li key={e.i}>{e.reason}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {narrative ? (
        <section className="space-y-4 rounded-2xl border border-zinc-800 bg-[#111] p-5">
          <div>
            <h2 className="text-lg font-semibold text-white">AI Revenue Summary</h2>
            <p className="mt-1 text-xs text-zinc-500">
              Deterministic, rules-based narrative generated from BNHub booking metrics — not predictive AI and not a future
              guarantee. Saved to audit history when generated.
            </p>
          </div>

          <div className="space-y-3 rounded-xl border border-zinc-800 bg-black/30 p-4">
            <div className="text-lg font-semibold text-white">{narrative.headline}</div>
            <p className="text-sm leading-relaxed text-zinc-400">{narrative.overview}</p>
            <p className="text-sm leading-relaxed text-zinc-500">{narrative.closing}</p>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <div className="rounded-xl border border-zinc-800 p-4">
              <h3 className="mb-3 font-medium text-white">Key facts</h3>
              <div className="space-y-3">
                {narrative.facts.map((fact) => (
                  <div key={`${fact.label}-${fact.value}`} className="text-sm">
                    <div className="font-medium text-zinc-200">
                      {fact.label}: {fact.value}
                    </div>
                    <div className="text-zinc-500">{fact.explanation}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-zinc-800 p-4">
              <h3 className="mb-3 font-medium text-white">Risks</h3>
              <div className="space-y-3">
                {narrative.risks.length ? (
                  narrative.risks.map((risk, index) => (
                    <div key={`${risk.severity}-${index}`} className="text-sm">
                      <div className="font-medium uppercase tracking-wide text-zinc-400">{risk.severity}</div>
                      <div className="text-zinc-500">{risk.message}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-zinc-500">No rule-based risk flags on these inputs.</div>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-zinc-800 p-4">
              <h3 className="mb-3 font-medium text-white">Opportunities</h3>
              <div className="space-y-3">
                {narrative.opportunities.length ? (
                  narrative.opportunities.map((item, index) => (
                    <div key={`${item.priority}-${index}`} className="text-sm">
                      <div className="font-medium uppercase tracking-wide text-zinc-400">{item.priority}</div>
                      <div className="text-zinc-500">{item.message}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-zinc-500">No rule-based opportunities flagged on these inputs.</div>
                )}
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="rounded-2xl border border-zinc-800 bg-[#111] p-5 text-sm text-zinc-500">
          AI Revenue Summary could not be generated. Check widget errors above or try again later.
        </section>
      )}

      {portfolio?.mixedCurrencyWarning ? (
        <p className="text-xs text-amber-300/90">
          Mixed listing currencies — totals sum platform `totalCents` without FX conversion; interpret with care.
        </p>
      ) : null}

      {portfolio ? (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-2xl border border-zinc-800 bg-[#111] p-5">
            <p className="text-xs uppercase text-zinc-500">Gross revenue</p>
            <p className="mt-2 text-2xl font-bold text-white">{formatMoney(cur, portfolio.grossRevenue)}</p>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-[#111] p-5">
            <p className="text-xs uppercase text-zinc-500">Bookings (check-in window)</p>
            <p className="mt-2 text-2xl font-bold text-white">{portfolio.bookingCount}</p>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-[#111] p-5">
            <p className="text-xs uppercase text-zinc-500">Occupancy</p>
            <p className="mt-2 text-2xl font-bold text-white">{percentRatio(portfolio.occupancyRate)}</p>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-[#111] p-5">
            <p className="text-xs uppercase text-zinc-500">ADR</p>
            <p className="mt-2 text-2xl font-bold text-white">{formatMoney(cur, portfolio.adr)}</p>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-[#111] p-5">
            <p className="text-xs uppercase text-zinc-500">RevPAR</p>
            <p className="mt-2 text-2xl font-bold text-white">{formatMoney(cur, portfolio.revpar)}</p>
          </div>
        </section>
      ) : (
        <p className="text-sm text-zinc-500">Portfolio metrics unavailable.</p>
      )}

      <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-[#111]">
        <div className="border-b border-zinc-800 px-4 py-3">
          <h2 className="text-lg font-semibold text-white">30-day revenue trend</h2>
          <p className="text-xs text-zinc-500">By booking recorded date (UTC), not guest stay night.</p>
        </div>
        <div className="max-h-[28rem] overflow-y-auto">
          <div className="divide-y divide-zinc-800/80">
            {trend.length === 0 ? (
              <p className="px-4 py-6 text-sm text-zinc-500">No trend rows.</p>
            ) : (
              trend.map((row) => (
                <div key={row.date} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 text-sm">
                  <span className="text-zinc-300">{row.date}</span>
                  <span className="font-medium text-white">{formatMoney(cur, row.revenue)}</span>
                  <span className="text-zinc-500">{row.bookings} bookings</span>
                  <span className="text-zinc-500">{row.nights} booked nights (stays)</span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-[#111]">
        <div className="border-b border-zinc-800 px-4 py-3">
          <h2 className="text-lg font-semibold text-white">Listing intelligence</h2>
          <p className="text-xs text-zinc-500">Per published stay; same 30-day UTC window as portfolio cards.</p>
        </div>
        <div className="space-y-3 p-4">
          {!summary?.listings?.length ? (
            <p className="text-sm text-zinc-500">No published listings in range.</p>
          ) : (
            summary.listings.map((listing) => (
              <div key={listing.listingId} className="rounded-xl border border-zinc-800 bg-black/30 p-4">
                <div className="font-semibold text-white">{listing.listingTitle}</div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm md:grid-cols-5">
                  <div className="text-zinc-400">
                    Revenue: <span className="text-white">{formatMoney(listing.currency, listing.grossRevenue)}</span>
                  </div>
                  <div className="text-zinc-400">
                    Bookings: <span className="text-white">{listing.bookingCount}</span>
                  </div>
                  <div className="text-zinc-400">
                    Occupancy: <span className="text-white">{percentRatio(listing.occupancyRate)}</span>
                  </div>
                  <div className="text-zinc-400">
                    ADR: <span className="text-white">{formatMoney(listing.currency, listing.adr)}</span>
                  </div>
                  <div className="text-zinc-400">
                    RevPAR: <span className="text-white">{formatMoney(listing.currency, listing.revpar)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-[#111]">
        <div className="border-b border-zinc-800 px-4 py-3">
          <h2 className="text-lg font-semibold text-white">Pricing execution</h2>
          <p className="text-xs text-zinc-500">Successful applies from BNHub pricing logs only.</p>
        </div>
        <div className="space-y-3 p-4">
          {pricingImpact ? (
            <>
              <p className="text-sm text-zinc-400">
                Applied actions (success): <strong className="text-white">{pricingImpact.appliedCount}</strong>
              </p>
              <p className="text-sm text-zinc-400">
                Average nightly delta:{" "}
                <strong className="text-white">{formatMoney(cur, pricingImpact.avgDelta)}</strong>
              </p>
              <div className="max-h-80 overflow-y-auto divide-y divide-zinc-800/80">
                {pricingImpact.latestExecutions.length === 0 ? (
                  <p className="py-4 text-sm text-zinc-500">No successful executions yet.</p>
                ) : (
                  pricingImpact.latestExecutions.map((row) => (
                    <div key={row.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                      <span className="text-zinc-500">{row.listing.title}</span>
                      <span className="text-zinc-400">{row.date.toISOString().slice(0, 10)}</span>
                      <span className="text-white">
                        {formatMoney(cur, row.oldPrice)} → {formatMoney(cur, row.newPrice)}
                      </span>
                      <span className="text-zinc-500">{row.status}</span>
                      <span className="max-w-md text-xs text-zinc-600">{row.reason ?? "—"}</span>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <p className="text-sm text-zinc-500">Pricing impact unavailable.</p>
          )}
        </div>
      </section>

      {anomalies.length > 0 ? (
        <section className="rounded-2xl border border-zinc-800 bg-[#111] p-4">
          <h2 className="font-semibold text-white">Snapshot signals</h2>
          <p className="mt-1 text-xs text-zinc-500">
            Based on stored BNHub revenue metric snapshots (run POST /api/bnhub/revenue/snapshots to refresh).
          </p>
          <ul className="mt-3 list-inside list-disc text-sm text-amber-200/90">
            {anomalies.map((a) => (
              <li key={a.message}>{a.message}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
