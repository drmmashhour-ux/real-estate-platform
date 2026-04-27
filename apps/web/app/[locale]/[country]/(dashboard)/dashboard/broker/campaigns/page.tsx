import type { Metadata } from "next";

import { BrokerBnhubGrowthOptimizerTable } from "@/components/broker/BrokerBnhubGrowthOptimizerTable";
import { BrokerCampaignsDashboardClient } from "@/components/broker/BrokerCampaignsDashboardClient";
import { CampaignLearningSection } from "@/components/broker/CampaignLearningSection";
import { AutoCampaignsBlock } from "@/components/broker/AutoCampaignsBlock";
import { CampaignPerformanceInsightsSection } from "@/components/broker/CampaignPerformanceInsightsSection";
import { CampaignOptimizationSection } from "@/components/broker/CampaignOptimizationSection";
import { requireAuthenticatedUser } from "@/lib/auth/require-session";
import { flags } from "@/lib/flags";
import { getCampaignPerformance } from "@/lib/marketing/campaignEngine";
import { getCampaignOptimizationInsights } from "@/lib/marketing/campaignOptimizer";
import { getBnhubGrowthCampaignDashboardData } from "@/lib/marketing/bnhubGrowthBrokerDashboard";

export const metadata: Metadata = {
  title: "Campaigns (simulation)",
  description: "Broker ad campaign drafts, scheduling, and simulated performance — no live ad spend.",
};

export const dynamic = "force-dynamic";

export default async function BrokerCampaignsPage() {
  const { userId } = await requireAuthenticatedUser();
  const [raw, bnhubRows, optInsights] = await Promise.all([
    getCampaignPerformance(userId, { limit: 20, offset: 0 }),
    getBnhubGrowthCampaignDashboardData(userId).catch((): Awaited<
      ReturnType<typeof getBnhubGrowthCampaignDashboardData>
    > => []),
    getCampaignOptimizationInsights(userId).catch((): Awaited<ReturnType<typeof getCampaignOptimizationInsights>> => []),
  ]);
  const listTotal = raw.mode === "campaigns" ? raw.total : 0;
  const initialRows = (raw.mode === "campaigns" ? raw.items : []).map(({ campaign, latestPerformance, metrics }) => ({
    campaign: {
      id: campaign.id,
      userId: campaign.userId,
      audience: campaign.audience,
      city: campaign.city,
      platform: campaign.platform,
      headline: campaign.headline,
      body: campaign.body,
      status: campaign.status,
      createdBy: campaign.createdBy,
      scheduledAt: campaign.scheduledAt?.toISOString() ?? null,
      startedAt: campaign.startedAt?.toISOString() ?? null,
      completedAt: campaign.completedAt?.toISOString() ?? null,
      createdAt: campaign.createdAt.toISOString(),
    },
    performance: latestPerformance
      ? {
          impressions: latestPerformance.impressions,
          clicks: latestPerformance.clicks,
          conversions: latestPerformance.conversions,
          spend: latestPerformance.spend,
        }
      : null,
    metrics,
  }));
  const optCampaigns = initialRows.map((r) => ({
    id: r.campaign.id,
    label: `${r.campaign.platform.toUpperCase()} — ${r.campaign.headline.slice(0, 48)}${r.campaign.headline.length > 48 ? "…" : ""}`,
  }));

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Campaigns (simulation)</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Drafts and simulated metrics only — not connected to Meta, TikTok, or Google Ads.
        </p>
      </div>
      <BrokerBnhubGrowthOptimizerTable
        initialRows={bnhubRows}
        featureEnabled={flags.AUTONOMOUS_AGENT}
      />
      <CampaignOptimizationSection
        initialInsights={optInsights}
        campaigns={optCampaigns}
        featureEnabled={flags.AUTONOMOUS_AGENT}
      />
      <AutoCampaignsBlock userId={userId} featureEnabled={flags.AUTONOMOUS_AGENT} />
      <CampaignPerformanceInsightsSection userId={userId} featureEnabled={flags.AUTONOMOUS_AGENT} />
      <CampaignLearningSection userId={userId} featureEnabled={flags.AUTONOMOUS_AGENT} />
      <BrokerCampaignsDashboardClient
        initialRows={initialRows}
        listTotal={listTotal}
        featureEnabled={flags.AUTONOMOUS_AGENT}
      />
    </div>
  );
}
