import Link from "next/link";
import { getInvestorMetrics } from "@/modules/investor/investor-metrics";
import { InvestorDashboardCharts } from "@/components/investor/InvestorDashboardCharts";
import { InvestorMarketInsightCard } from "@/components/ai/InvestorMarketInsightCard";
import { DailyDealFeed } from "@/src/modules/daily-deal-feed/ui/DailyDealFeed";
import { getGuestId } from "@/lib/auth/session";
import { getDailyDealFeed } from "@/src/modules/daily-deal-feed/application/getDailyDealFeed";
import { getWatchlistSummary } from "@/src/modules/watchlist-alerts/infrastructure/watchlistSummaryService";
import { listWatchlistAlerts } from "@/src/modules/watchlist-alerts/infrastructure/watchlistAlertRepository";
import { WatchlistAlertsPreview } from "@/src/modules/watchlist-alerts/ui/WatchlistAlertsPreview";

const GOLD = "#C9A646";

export default async function InvestorDashboardPage() {
  const userId = await getGuestId();
  const [data, feed, watchSummary, recentAlerts] = await Promise.all([
    getInvestorMetrics(30),
    userId ? getDailyDealFeed({ userId, limit: 12 }) : Promise.resolve(null),
    userId ? getWatchlistSummary(userId) : Promise.resolve(null),
    userId ? listWatchlistAlerts({ userId, limit: 4 }) : Promise.resolve([]),
  ]);
  const k = data.kpis;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            Live platform KPIs{data.demoMode ? " · demo smoothing enabled for staging" : ""}
          </p>
        </div>
        <Link
          href="/investor/qa"
          className="rounded-xl border border-[#C9A646]/35 bg-[#C9A646]/10 px-4 py-2.5 text-sm font-semibold text-[#C9A646] transition hover:bg-[#C9A646]/15"
        >
          Investor Q&A
        </Link>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard label="Total listings" value={k.totalListings} accent={GOLD} />
        <KpiCard label="Active listings" value={k.activeListings} />
        <KpiCard label="Users" value={k.totalUsers} />
        <KpiCard label="Transactions (composite)" value={k.totalTransactions} />
        <KpiCard
          label="Revenue (CAD)"
          value={`$${(k.totalRevenueCents / 100).toLocaleString("en-CA", { maximumFractionDigits: 0 })}`}
        />
      </div>

      <div className="mt-10">
        <InvestorDashboardCharts data={data} />
      </div>

      <InvestorMarketInsightCard
        demoMode={data.demoMode}
        kpis={{
          totalListings: k.totalListings,
          activeListings: k.activeListings,
          totalUsers: k.totalUsers,
          totalTransactions: k.totalTransactions,
          totalRevenueCents: k.totalRevenueCents,
        }}
      />
      <div className="mt-8">
        {watchSummary ? (
          <div className="mb-4 rounded-2xl border border-white/10 bg-black/25 p-4">
            <p className="text-xs uppercase tracking-wide text-[#C9A646]">Watchlist summary</p>
            <p className="mt-2 text-sm text-slate-300">
              {watchSummary.savedListings} saved · {watchSummary.unreadAlerts} unread alerts · {watchSummary.strongOpportunityUpdates} strong opportunity updates
            </p>
            <a href="/watchlist" className="mt-2 inline-flex text-sm text-[#C9A646] hover:underline">Open watchlist</a>
          </div>
        ) : null}
        {recentAlerts.length ? (
          <div className="mb-4">
            <WatchlistAlertsPreview initialAlerts={recentAlerts} />
          </div>
        ) : null}
        <DailyDealFeed initialFeed={feed} />
      </div>
    </div>
  );
}

function KpiCard({ label, value, accent }: { label: string; value: number | string; accent?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums" style={accent ? { color: accent } : undefined}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
    </div>
  );
}
