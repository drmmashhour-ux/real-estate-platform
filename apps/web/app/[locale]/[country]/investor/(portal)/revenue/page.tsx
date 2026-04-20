import Link from "next/link";
import { getInvestorByEmail } from "@/modules/investor/auth/investor-auth";
import { requireInvestorUser } from "@/lib/auth/require-investor";
import { getPricingImpactSummary } from "@/modules/bnhub-revenue/bnhub-pricing-impact.service";
import { getRevenueDashboardSummary } from "@/modules/bnhub-revenue/bnhub-revenue-dashboard.service";

export const dynamic = "force-dynamic";

const GOLD = "var(--color-premium-gold)";

function formatMoney(currencyCode: string, value: number) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: currencyCode.length === 3 ? currencyCode : "USD",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatPercentRatio(r: number) {
  return `${Math.round(Math.min(1, Math.max(0, r)) * 100)}%`;
}

/**
 * Live listing + portfolio BNHub KPIs for an allowlisted investor scope.
 * Same math as the host revenue page; read-only; no invented metrics.
 */
export default async function InvestorBnhubRevenueIntelligencePage() {
  const { email } = await requireInvestorUser();
  const access = await getInvestorByEmail(email);

  if (!access?.isActive) {
    return (
      <div className="rounded-2xl border border-amber-900/40 bg-amber-950/20 p-8 text-slate-300">
        <h1 className="text-lg font-semibold text-white">Revenue intelligence</h1>
        <p className="mt-2 text-sm text-slate-400">
          No portfolio access is linked to this investor account. Ask the operator to activate{" "}
          <code className="text-amber-200/90">InvestorAccess</code>.
        </p>
      </div>
    );
  }

  const hostUserId = access.scopeId.trim();

  const settled = await Promise.allSettled([
    getRevenueDashboardSummary(hostUserId),
    getPricingImpactSummary(hostUserId),
  ]);

  const summary = settled[0].status === "fulfilled" ? settled[0].value : null;
  const pricingImpact = settled[1].status === "fulfilled" ? settled[1].value : null;

  const widgetWarnings = settled
    .map((r, i) => (r.status === "rejected" ? `Widget ${i}: ${String(r.reason)}` : null))
    .filter(Boolean) as string[];

  const portfolio = summary?.portfolio;
  const listings = summary?.listings ?? [];
  const cur = portfolio?.displayCurrency ?? "USD";

  return (
    <div className="space-y-10">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: GOLD }}>
          BNHub portfolio
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-white">Revenue intelligence</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-500">
          Operational KPIs from BNHub <code className="font-mono text-slate-600">Booking</code> totals (UTC); definitions
          match the host dashboard. Pricing impact pulls successful execution logs only.
        </p>
        <Link href="/investor/bnhub-reports" className="mt-3 inline-block text-sm font-medium hover:underline" style={{ color: GOLD }}>
          Narrative + PDF history →
        </Link>
      </div>

      {widgetWarnings.length > 0 ? (
        <div className="rounded-xl border border-amber-900/35 bg-amber-950/25 px-4 py-3 text-xs text-amber-100/90">
          Partial load — some widgets failed.
          <ul className="mt-2 list-inside list-disc">
            {widgetWarnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {portfolio?.mixedCurrencyWarning ? (
        <p className="text-xs text-amber-200/80">
          Mixed listing currencies — totals sum raw cents without FX; interpret totals carefully.
        </p>
      ) : null}

      {portfolio ? (
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-lg font-semibold text-white">Portfolio (last 30 UTC days)</h2>
          <p className="mt-1 text-xs text-slate-500">Check-in window for headline KPIs.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Kpi label="Gross revenue" value={formatMoney(cur, portfolio.grossRevenue)} accent />
            <Kpi label="Bookings" value={String(portfolio.bookingCount)} />
            <Kpi label="Occupancy" value={formatPercentRatio(portfolio.occupancyRate)} />
            <Kpi label="ADR" value={formatMoney(cur, portfolio.adr)} />
            <Kpi label="RevPAR" value={formatMoney(cur, portfolio.revpar)} />
          </div>
        </section>
      ) : (
        <p className="text-sm text-slate-500">Portfolio metrics unavailable.</p>
      )}

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="text-lg font-semibold text-white">Listing performance</h2>
        <p className="mt-1 text-xs text-slate-500">Published stays only; same window as portfolio.</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-500">
                <th className="py-2 pr-4 font-medium">Listing</th>
                <th className="py-2 pr-4 font-medium">Revenue</th>
                <th className="py-2 pr-4 font-medium">Bookings</th>
                <th className="py-2 pr-4 font-medium">Occupancy</th>
                <th className="py-2 pr-4 font-medium">ADR</th>
                <th className="py-2 font-medium">RevPAR</th>
              </tr>
            </thead>
            <tbody>
              {listings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No published listings in scope for this window.
                  </td>
                </tr>
              ) : (
                listings.map((row) => (
                  <tr key={row.listingId} className="border-b border-white/5 text-slate-300">
                    <td className="max-w-[14rem] py-2 pr-4 text-white">{row.listingTitle}</td>
                    <td className="py-2 pr-4 tabular-nums">{formatMoney(row.currency, row.grossRevenue)}</td>
                    <td className="py-2 pr-4 tabular-nums">{row.bookingCount}</td>
                    <td className="py-2 pr-4 tabular-nums">{formatPercentRatio(row.occupancyRate)}</td>
                    <td className="py-2 pr-4 tabular-nums">{formatMoney(row.currency, row.adr)}</td>
                    <td className="py-2 tabular-nums">{formatMoney(row.currency, row.revpar)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="text-lg font-semibold text-white">Pricing execution (BNHub)</h2>
        <p className="mt-1 text-xs text-slate-500">Successful nightly rate applies from audit log only.</p>
        {pricingImpact ? (
          <>
            <p className="mt-4 text-sm text-slate-400">
              Applied (success): <strong className="text-white">{pricingImpact.appliedCount}</strong>
            </p>
            <p className="text-sm text-slate-400">
              Average delta: <strong className="text-white">{formatMoney(cur, pricingImpact.avgDelta)}</strong>
            </p>
            <div className="mt-4 max-h-72 overflow-y-auto divide-y divide-white/10">
              {pricingImpact.latestExecutions.length === 0 ? (
                <p className="py-6 text-sm text-slate-500">No executions in this scope yet.</p>
              ) : (
                pricingImpact.latestExecutions.map((row) => (
                  <div key={row.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                    <span className="text-slate-500">{row.listing.title}</span>
                    <span className="text-slate-400">{row.date.toISOString().slice(0, 10)}</span>
                    <span className="text-white">
                      {formatMoney(cur, row.oldPrice)} → {formatMoney(cur, row.newPrice)}
                    </span>
                    <span className="max-w-md text-xs text-slate-600">{row.reason ?? "—"}</span>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <p className="mt-4 text-sm text-slate-500">Pricing impact unavailable.</p>
        )}
      </section>
    </div>
  );
}

function Kpi({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-4">
      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums text-white" style={accent ? { color: GOLD } : undefined}>
        {value}
      </p>
    </div>
  );
}
