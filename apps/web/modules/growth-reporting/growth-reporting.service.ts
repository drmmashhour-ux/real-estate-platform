/**
 * Cross-surface growth reporting — aggregates real DB rows only.
 */
import { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { engineFlags, landingConversionFlags } from "@/config/feature-flags";
import { listGrowthLeadsForUser } from "@/modules/lead-gen";
import { aggregatePerformanceForUser } from "@/modules/marketing-performance";
import { listCampaigns } from "@/modules/campaigns/campaign.service";
import { buildAdsLandingMetrics, type AdsLandingMetrics } from "./ads-landing-metrics.service";

export async function buildGrowthDashboardPayload(opts: {
  userId: string;
  role: PlatformRole;
}): Promise<{
  leadsPreview: Awaited<ReturnType<typeof listGrowthLeadsForUser>>;
  campaignsCount: number;
  performance90d: Awaited<ReturnType<typeof aggregatePerformanceForUser>>;
  referralsCount: number;
  adsLandingMetrics: AdsLandingMetrics | null;
}> {
  const since = new Date(Date.now() - 90 * 86400000);
  const [leads, campaigns, perf, referralCount, adsLandingMetrics] = await Promise.all([
    listGrowthLeadsForUser({ userId: opts.userId, role: opts.role, take: 15 }),
    listCampaigns().catch(() => []),
    aggregatePerformanceForUser(opts.userId, since).catch(() => ({
      eventCount: 0,
      impressions: 0,
      clicks: 0,
      amountByKey: {} as Record<string, number>,
    })),
    prisma.referral.count({ where: { referrerId: opts.userId } }).catch(() => 0),
    engineFlags.marketingIntelligenceV1 && landingConversionFlags.landingPagesV1
      ? buildAdsLandingMetrics(90).catch(() => null)
      : Promise.resolve(null),
  ]);

  return {
    leadsPreview: leads,
    campaignsCount: campaigns.length,
    performance90d: perf,
    referralsCount: referralCount,
    adsLandingMetrics,
  };
}
