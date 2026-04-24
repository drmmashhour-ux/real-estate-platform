import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PLATFORM_DEFAULT_DESCRIPTION } from "@/lib/brand/platform";
import { prisma } from "@repo/db";
import { engineFlags } from "@/config/feature-flags";
import { ClassicDashboardBanner } from "@/components/dashboard/ClassicDashboardBanner";
import { requireAuthenticatedUser } from "@/lib/auth/require-session";
import {
  LECIPM_DASHBOARD_CONSOLE_COOKIE,
  shouldRedirectRootDashboardToLecipm,
} from "@/lib/dashboard/lecipm-console-preference";
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
export const revalidate = 0;

export default async function InvestmentPortfolioDashboardPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>;
}) {
  const { locale, country } = await params;
  const { userId } = await requireAuthenticatedUser();

  const jar = await cookies();
  const pref = jar.get(LECIPM_DASHBOARD_CONSOLE_COOKIE)?.value;
  if (shouldRedirectRootDashboardToLecipm(engineFlags.lecipmConsoleDefault, pref)) {
    redirect(`/${locale}/${country}/dashboard/lecipm`);
  }

  const deals = await prisma.investmentDeal.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { plan: true } });
  const feed = await getDailyDealFeed({ userId, limit: 18 });
  const watchSummary = await getWatchlistSummary(userId);
  const watchAlerts = await listWatchlistAlerts({ userId, limit: 6 });
  const bestProperties = await selectBestProperties(userId);
  const bestLeads = await selectBestLeads(userId);

  const monetization = buildMonetizationSnapshot(user?.plan ?? "free", deals.length);

  return (
    <div className="min-h-screen bg-brand-background text-white">
      <MvpNav variant="live" />
      <div className="mx-auto w-full max-w-6xl px-4 pt-6">
        <ClassicDashboardBanner />
      </div>
      <PortfolioDashboardClient
        deals={deals}
        variant="live"
        shareReferrerUserId={userId}
        monetization={monetization}
      />
      <div className="mx-auto mt-6 w-full max-w-6xl px-4 pb-10">
        <div className="mb-4 rounded-2xl border border-white/10 bg-black/25 p-4 text-white">
          <p className="text-xs uppercase tracking-wide text-premium-gold">Watchlist pulse</p>
          <p className="mt-2 text-sm">
            {watchSummary.savedListings} saved properties · {watchSummary.unreadAlerts} unread alerts · {watchSummary.changedToday} changed today
          </p>
          <a href="/watchlist" className="mt-2 inline-flex text-sm text-premium-gold hover:underline">Open watchlist</a>
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
