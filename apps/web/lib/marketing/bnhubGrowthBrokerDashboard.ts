import "server-only";

import { prisma } from "@/lib/db";
import { optimizeCampaign, type CampaignOptimizerResult } from "@/lib/campaign-optimizer/optimize-campaign-hardening";
import { flags } from "@/lib/flags";

export type BnhubGrowthCampaignListRow = {
  campaign: {
    id: string;
    status: string;
    campaignName: string;
    targetCity: string | null;
    targetRegion: string | null;
    campaignType: string;
    createdAt: string;
  };
  performance: {
    impressions: number;
    clicks: number;
    conversions: number;
    spend: number;
    ctr: number;
    conversionRate: number;
  } | null;
  /** Latest dry-run result when autonomous agent is enabled; null when flag is off. */
  optimizerPreview: CampaignOptimizerResult | null;
};

/**
 * BNHub growth campaigns for the host user — aligned with `POST /api/bnhub/growth/optimize-campaign` (Order 40).
 */
export async function getBnhubGrowthCampaignDashboardData(userId: string): Promise<BnhubGrowthCampaignListRow[]> {
  const campaigns = await prisma.bnhubGrowthCampaign.findMany({
    where: { hostUserId: userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const out: BnhubGrowthCampaignListRow[] = [];

  for (const c of campaigns) {
    const latest = await prisma.campaignPerformance.findFirst({
      where: { campaignId: c.id },
      orderBy: { createdAt: "desc" },
    });
    const perf = latest
      ? (() => {
          const im = latest.impressions;
          const cl = latest.clicks;
          const conv = latest.conversions;
          const spend = latest.spendCents / 100;
          const ctr = im > 0 ? cl / im : 0;
          const cvr = cl > 0 ? conv / cl : 0;
          return {
            impressions: im,
            clicks: cl,
            conversions: conv,
            spend,
            ctr,
            conversionRate: cvr,
          };
        })()
      : null;

    let opt: CampaignOptimizerResult | null = null;
    if (flags.AUTONOMOUS_AGENT) {
      try {
        opt = await optimizeCampaign(userId, c.id, true);
      } catch {
        opt = null;
      }
    }

    out.push({
      campaign: {
        id: c.id,
        status: c.status,
        campaignName: c.campaignName,
        targetCity: c.targetCity,
        targetRegion: c.targetRegion,
        campaignType: c.campaignType,
        createdAt: c.createdAt.toISOString(),
      },
      performance: perf,
      optimizerPreview: opt,
    });
  }

  return out;
}
