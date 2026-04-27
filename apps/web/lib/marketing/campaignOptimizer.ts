import "server-only";

import { BrokerAdSimulationCampaignStatus } from "@prisma/client";

import { getLegacyDB } from "@/lib/db/legacy";
import { writeMarketplaceEvent } from "@/lib/analytics/tracker";
import { flags } from "@/lib/flags";
import { generateAdCopy, type AdAudience } from "@/lib/marketing/adCopyEngine";
import { derivePerformanceMetrics } from "@/lib/marketing/campaignEnginePure";
import {
  computeOptimizationRecommendation,
  platformAsAdPlatform,
} from "@/lib/marketing/campaignOptimizerRules";

const prisma = getLegacyDB();

export type CampaignOptimizationInsight = {
  campaignId: string;
  platform: "tiktok" | "meta" | "google";
  status: string;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  ctr: number;
  conversionRate: number;
  costPerConversion: number | null;
  recommendation: "scale_budget" | "pause_campaign" | "improve_copy" | "keep_running";
  suggestedAction: string;
  reason: string;
};

function audienceForAdCopy(audience: string): AdAudience {
  const a = audience.toLowerCase();
  if (a === "buyer" || a === "seller" || a === "host" || a === "broker") return a;
  return "buyer";
}

function buildInsight(
  campaign: { id: string; platform: string; status: string },
  metrics: ReturnType<typeof derivePerformanceMetrics> | null
): CampaignOptimizationInsight {
  const m = metrics;
  const derived = computeOptimizationRecommendation(
    m
      ? {
          impressions: m.impressions,
          clicks: m.clicks,
          conversions: m.conversions,
          spend: m.spend,
          ctr: m.ctr,
          conversionRate: m.conversionRate,
          costPerConversion: m.costPerConversion,
        }
      : null
  );
  const plat = platformAsAdPlatform(campaign.platform);
  return {
    campaignId: campaign.id,
    platform: plat,
    status: String(campaign.status),
    impressions: m?.impressions ?? 0,
    clicks: m?.clicks ?? 0,
    conversions: m?.conversions ?? 0,
    spend: m?.spend ?? 0,
    ctr: m?.ctr ?? 0,
    conversionRate: m?.conversionRate ?? 0,
    costPerConversion: m?.costPerConversion ?? null,
    recommendation: derived.recommendation,
    suggestedAction: derived.suggestedAction,
    reason: derived.reason,
  };
}

/**
 * All simulated campaigns for the user with derived metrics and optimization hints.
 * Returns [] when autonomous marketing is disabled.
 */
export async function getCampaignOptimizationInsights(userId: string): Promise<CampaignOptimizationInsight[]> {
  if (!flags.AUTONOMOUS_AGENT) {
    return [];
  }
  const rows = await prisma.brokerAdSimulationCampaign.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { performanceRows: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  return rows.map((r) => {
    const { performanceRows, ...c } = r;
    const latest = performanceRows[0];
    const metrics = latest ? derivePerformanceMetrics(latest) : null;
    return buildInsight(c, metrics);
  });
}

/**
 * System-wide (marketplace) view of all simulated ad campaigns — read-only recommendations.
 * Used by the autonomous marketplace brain; does not write or mutate campaigns.
 */
export async function getCampaignOptimizationInsightsForMarketplace(): Promise<CampaignOptimizationInsight[]> {
  if (!flags.AUTONOMOUS_AGENT) {
    return [];
  }
  const rows = await prisma.brokerAdSimulationCampaign.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
    include: { performanceRows: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  return rows.map((r) => {
    const { performanceRows, ...c } = r;
    const latest = performanceRows[0];
    const metrics = latest ? derivePerformanceMetrics(latest) : null;
    return buildInsight(c, metrics);
  });
}

export type OptimizeCampaignResult = {
  insight: CampaignOptimizationInsight;
  dryRun: boolean;
  applied: boolean;
  /** Populated when recommendation is improve_copy and not dry run. */
  adCopySuggestion?: ReturnType<typeof generateAdCopy>;
  /** Order 86 — alias of `adCopySuggestion` for API/docs. */
  newCopy?: ReturnType<typeof generateAdCopy>;
};

/**
 * Loads campaign + latest simulated performance, computes recommendation, optionally applies safe internal actions only.
 */
export async function optimizeCampaign(
  campaignId: string,
  userId: string,
  dryRun = true
): Promise<OptimizeCampaignResult> {
  if (!flags.AUTONOMOUS_AGENT) {
    throw new Error("OPTIMIZATION_DISABLED");
  }

  const row = await prisma.brokerAdSimulationCampaign.findFirst({
    where: { id: campaignId, userId },
    include: { performanceRows: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  if (!row) {
    throw new Error("CAMPAIGN_NOT_FOUND");
  }

  const { performanceRows, ...campaign } = row;
  const latest = performanceRows[0];
  const metrics = latest ? derivePerformanceMetrics(latest) : null;
  const insight = buildInsight(campaign, metrics);

  if (dryRun) {
    return { insight, dryRun: true, applied: false, newCopy: undefined };
  }

  void writeMarketplaceEvent("campaign_optimization_generated", {
    userId,
    campaignId,
    recommendation: insight.recommendation,
  }).catch(() => {});

  const rec = insight.recommendation;
  let applied = false;
  let adCopySuggestion: ReturnType<typeof generateAdCopy> | undefined;

  if (rec === "scale_budget") {
    await writeMarketplaceEvent("campaign_budget_scale_recommended", {
      userId,
      campaignId,
      recommendation: rec,
      simulated: true,
    });
    applied = true;
  } else if (rec === "pause_campaign") {
    if (campaign.status !== BrokerAdSimulationCampaignStatus.completed) {
      await prisma.brokerAdSimulationCampaign.update({
        where: { id: campaignId },
        data: { status: BrokerAdSimulationCampaignStatus.completed, completedAt: new Date() },
      });
    }
    applied = true;
  } else if (rec === "improve_copy") {
    adCopySuggestion = generateAdCopy({
      audience: audienceForAdCopy(campaign.audience),
      city: campaign.city ?? undefined,
    });
    applied = true;
  } else {
    applied = false;
  }

  if (applied) {
    void writeMarketplaceEvent("campaign_optimization_applied", {
      userId,
      campaignId,
      recommendation: rec,
    }).catch(() => {});
  }

  return { insight, dryRun: false, applied, adCopySuggestion, newCopy: adCopySuggestion };
}
