"use client";

import { ConnectedChannelsPanel } from "@/src/modules/growth-automation/ui/ConnectedChannelsPanel";
import { ContentCalendar } from "@/src/modules/growth-automation/ui/ContentCalendar";
import { ContentDraftQueue } from "@/src/modules/growth-automation/ui/ContentDraftQueue";
import { ContentPerformanceInsights } from "@/src/modules/growth-automation/ui/ContentPerformanceInsights";
import { ContentStrategyPanel } from "@/src/modules/growth-automation/ui/ContentStrategyPanel";
import { DailyContentPlanCard } from "@/src/modules/growth-automation/ui/DailyContentPlanCard";
import { OptimizationRecommendationsCard } from "@/src/modules/growth-automation/ui/OptimizationRecommendationsCard";
import { PerformanceInsightsPanel } from "@/src/modules/growth-automation/ui/PerformanceInsightsPanel";
import { PublishingStatusPanel } from "@/src/modules/growth-automation/ui/PublishingStatusPanel";
import { WeeklyOptimizationReport } from "@/src/modules/growth-automation/ui/WeeklyOptimizationReport";

export function GrowthAutomationDashboard() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <ContentStrategyPanel />
      <DailyContentPlanCard />
      <div className="rounded-xl border border-white/10 bg-black/25 p-4">
        <h3 className="text-sm font-semibold text-white">Connected channels (OAuth)</h3>
        <p className="mt-1 text-xs text-slate-500">
          Tokens are encrypted at rest. Connect via POST /api/growth/channels/connect after your OAuth callback.
        </p>
        <div className="mt-3">
          <ConnectedChannelsPanel />
        </div>
      </div>
      <div className="rounded-xl border border-white/10 bg-black/25 p-4 lg:col-span-2">
        <h3 className="text-sm font-semibold text-white">Draft queue</h3>
        <p className="mt-1 text-xs text-slate-500">Review-first: approve before schedule/publish.</p>
        <div className="mt-3">
          <ContentDraftQueue />
        </div>
      </div>
      <div className="rounded-xl border border-white/10 bg-black/25 p-4">
        <h3 className="text-sm font-semibold text-white">Calendar (7d)</h3>
        <div className="mt-3">
          <ContentCalendar />
        </div>
      </div>
      <div className="rounded-xl border border-white/10 bg-black/25 p-4">
        <h3 className="text-sm font-semibold text-white">Publishing status</h3>
        <div className="mt-3">
          <PublishingStatusPanel />
        </div>
      </div>
      <ContentPerformanceInsights />
      <PerformanceInsightsPanel />
      <OptimizationRecommendationsCard />
      <WeeklyOptimizationReport />
    </div>
  );
}
