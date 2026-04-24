import Link from "next/link";
import { MvpNav } from "@/components/investment/MvpNav";
import { requireBrokerDashboard } from "@/modules/mortgage/services/require-broker-dashboard";
import { BrokerDashboardClient } from "../broker-dashboard-client";
import { NextActionPanel } from "@/components/conversion/NextActionPanel";
import { AIInsightPanel } from "@/components/conversion/AIInsightPanel";
import { DailyDealFeed } from "@/src/modules/daily-deal-feed/ui/DailyDealFeed";
import { getGuestId } from "@/lib/auth/session";
import { getDailyDealFeed } from "@/src/modules/daily-deal-feed/application/getDailyDealFeed";
import { getWatchlistSummary } from "@/src/modules/watchlist-alerts/infrastructure/watchlistSummaryService";
import { listWatchlistAlerts } from "@/src/modules/watchlist-alerts/infrastructure/watchlistAlertRepository";
import { WatchlistAlertsPreview } from "@/src/modules/watchlist-alerts/ui/WatchlistAlertsPreview";
import { AutopilotActionPanel } from "@/components/ai-autopilot/AutopilotActionPanel";

export const dynamic = "force-dynamic";

export default async function BrokerDashboardPage() {
  await requireBrokerDashboard();
  const userId = await getGuestId();
  const [feed, watchSummary, recentAlerts] = await Promise.all([
    userId ? getDailyDealFeed({ userId, limit: 12 }) : Promise.resolve(null),
    userId ? getWatchlistSummary(userId) : Promise.resolve(null),
    userId ? listWatchlistAlerts({ userId, limit: 4 }) : Promise.resolve([]),
  ]);

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-slate-50">
      <MvpNav variant="live" />
      <div className="mx-auto max-w-4xl px-4 py-10">
        <p className="mb-6 rounded-xl border border-white/10 bg-[#14110a]/80 px-4 py-3 text-xs leading-relaxed text-slate-400">
          This platform connects clients with brokers. All professionals must comply with AMF regulations.
        </p>
        <BrokerDashboardClient />
        <div className="mt-6 space-y-4">
          {watchSummary ? (
            <div className="rounded-xl border border-white/10 bg-black/25 p-4">
              <p className="text-xs uppercase tracking-wide text-premium-gold">Watchlist summary</p>
              <p className="mt-2 text-sm text-slate-300">
                {watchSummary.savedListings} saved properties · {watchSummary.unreadAlerts} unread alerts
              </p>
              <a href="/watchlist" className="mt-2 inline-flex text-sm text-premium-gold hover:underline">Open watchlist</a>
            </div>
          ) : null}
          {recentAlerts.length ? <WatchlistAlertsPreview initialAlerts={recentAlerts} /> : null}
          <DailyDealFeed initialFeed={feed} />
          <NextActionPanel
            title="Broker conversion focus"
            body="Move leads from contact to qualified quickly using trust + deal context."
            ctaHref="/dashboard/broker/pipeline"
            ctaLabel="Open pipeline"
            secondaryHref="/pricing/broker"
            secondaryLabel="View broker plans"
          />
          <AIInsightPanel
            title="Suggested actions"
            insights={[
              "Respond to new high-intent leads within 24h.",
              "Verify low-trust listings before scheduling visits.",
              "Use score-driven follow-up to increase conversion.",
            ]}
          />
          <div className="max-w-xl">
            <AutopilotActionPanel showModeSelector title="AI Autopilot — tableau de bord" />
          </div>
        </div>
        <p className="mt-10 border-t border-white/10 pt-6 text-center text-sm text-slate-500">
          <Link href="/dashboard" className="text-premium-gold hover:underline">
            Back to portfolio
          </Link>
        </p>
      </div>
    </div>
  );
}
