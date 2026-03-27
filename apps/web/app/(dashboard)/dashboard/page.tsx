import type { Metadata } from "next";
import { PLATFORM_DEFAULT_DESCRIPTION } from "@/lib/brand/platform";
import { prisma } from "@/lib/db";
import { requireAuthenticatedUser } from "@/lib/auth/require-session";
import { buildMonetizationSnapshot } from "@/lib/investment/monetization";
import { MvpNav } from "@/components/investment/MvpNav";
import { PortfolioDashboardClient } from "@/components/investment/PortfolioDashboardClient";
import { DailyDealFeed } from "@/src/modules/daily-deal-feed/ui/DailyDealFeed";
import { getDailyDealFeed } from "@/src/modules/daily-deal-feed/application/getDailyDealFeed";
import { getWatchlistSummary } from "@/src/modules/watchlist-alerts/infrastructure/watchlistSummaryService";
import { listWatchlistAlerts } from "@/src/modules/watchlist-alerts/infrastructure/watchlistAlertRepository";
import { WatchlistAlertsPreview } from "@/src/modules/watchlist-alerts/ui/WatchlistAlertsPreview";
import { selectBestProperties } from "@/src/modules/ai-selection-engine/application/selectBestProperties";
import { selectBestLeads } from "@/src/modules/ai-selection-engine/application/selectBestLeads";
import { BestSelectionsPanel } from "@/src/modules/ai-selection-engine/ui/BestSelectionsPanel";

export const metadata: Metadata = {
  title: "Portfolio",
  description: "Track and share your saved investment deals — powered by LECIPM.",
  openGraph: {
    title: "Portfolio",
    description: PLATFORM_DEFAULT_DESCRIPTION,
  },
};

export const dynamic = "force-dynamic";

export default async function InvestmentPortfolioDashboardPage() {
  const { userId } = await requireAuthenticatedUser();

  const [deals, user, feed, watchSummary, watchAlerts, bestProperties, bestLeads] = await Promise.all([
    prisma.investmentDeal.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findUnique({ where: { id: userId }, select: { plan: true } }),
    getDailyDealFeed({ userId, limit: 18 }),
    getWatchlistSummary(userId),
    listWatchlistAlerts({ userId, limit: 6 }),
    selectBestProperties(userId),
    selectBestLeads(userId),
  ]);

  const monetization = buildMonetizationSnapshot(user?.plan ?? "free", deals.length);

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white">
      <MvpNav variant="live" />
      <PortfolioDashboardClient
        deals={deals}
        variant="live"
        shareReferrerUserId={userId}
        monetization={monetization}
      />
      <div className="mx-auto mt-6 w-full max-w-6xl px-4 pb-10">
        <div className="mb-4 rounded-2xl border border-white/10 bg-black/25 p-4 text-white">
          <p className="text-xs uppercase tracking-wide text-[#C9A646]">Watchlist pulse</p>
          <p className="mt-2 text-sm">
            {watchSummary.savedListings} saved properties · {watchSummary.unreadAlerts} unread alerts · {watchSummary.changedToday} changed today
          </p>
          <a href="/watchlist" className="mt-2 inline-flex text-sm text-[#C9A646] hover:underline">Open watchlist</a>
          {watchAlerts.length ? <p className="mt-2 text-xs text-slate-400">Latest: {watchAlerts[0]?.title}</p> : null}
        </div>
        <div className="mb-4">
          <WatchlistAlertsPreview initialAlerts={watchAlerts} />
        </div>
        <div className="mb-4">
          <BestSelectionsPanel properties={bestProperties} leads={bestLeads} />
        </div>
        <DailyDealFeed initialFeed={feed} />
      </div>
    </div>
  );
}
