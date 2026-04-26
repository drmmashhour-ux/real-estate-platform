import { BnhubGrowthCampaignStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { trackEvent } from "@/lib/analytics/tracker";
import { flags } from "@/lib/flags";
import { generateMarketingCopy, type MarketingGeneratorInput } from "@/modules/marketing/marketing-generator.service";

export type OptimizerSuggestionAction =
  | "scale_budget"
  | "pause_campaign"
  | "improve_copy"
  | "keep_running";

export type CampaignOptimizerResult = {
  campaignId: string;
  dryRun: boolean;
  recommendation: OptimizerSuggestionAction;
  suggestedAction: OptimizerSuggestionAction;
  reason: string;
  applied: boolean;
  newCopy?: { headline: string; body: string };
};

const NOT_RUN: Omit<CampaignOptimizerResult, "campaignId" | "dryRun"> = {
  recommendation: "keep_running",
  suggestedAction: "keep_running",
  reason: "Campaign has not run yet.",
  applied: false,
};

const NO_DATA: Omit<CampaignOptimizerResult, "campaignId" | "dryRun"> = {
  recommendation: "keep_running",
  suggestedAction: "keep_running",
  reason: "No performance data available yet.",
  applied: false,
};

const FLAG_OFF = (campaignId: string, dryRun: boolean): CampaignOptimizerResult => ({
  campaignId,
  dryRun,
  applied: false,
  recommendation: "keep_running",
  suggestedAction: "keep_running",
  reason: "Autonomous optimization is disabled.",
});

/**
 * Hardened BNHub growth campaign optimizer (Order 39.1).
 * `userId` must match `BnhubGrowthCampaign.hostUserId` (orchestrator/owner of the ad account).
 */
export async function optimizeCampaign(
  userId: string,
  campaignId: string,
  dryRun = true
): Promise<CampaignOptimizerResult> {
  if (!flags.AUTONOMOUS_AGENT) {
    return { ...FLAG_OFF(campaignId, dryRun) };
  }

  const campaign = await prisma.bnhubGrowthCampaign.findUnique({
    where: { id: campaignId },
  });

  if (!campaign) {
    return {
      campaignId,
      dryRun,
      recommendation: "keep_running",
      suggestedAction: "keep_running",
      reason: "Campaign not found.",
      applied: false,
    };
  }

  if (campaign.hostUserId !== userId) {
    return {
      campaignId,
      dryRun,
      recommendation: "keep_running",
      suggestedAction: "keep_running",
      reason: "Forbidden: campaign does not belong to the current user.",
      applied: false,
    };
  }

  if (
    campaign.status === BnhubGrowthCampaignStatus.DRAFT ||
    campaign.status === BnhubGrowthCampaignStatus.SCHEDULED
  ) {
    return { ...NOT_RUN, campaignId, dryRun };
  }

  const latest = await prisma.campaignPerformance.findFirst({
    where: { campaignId },
    orderBy: { createdAt: "desc" },
  });

  if (!latest) {
    return { ...NO_DATA, campaignId, dryRun };
  }

  const impressions = latest.impressions;
  const clicks = latest.clicks;
  const conversions = latest.conversions;
  const spendCents = latest.spendCents;

  const ctr = impressions > 0 ? clicks / impressions : 0;
  const conversionRate = clicks > 0 ? conversions / clicks : 0;
  const spendMajor = spendCents / 100;
  const costPerConversion = conversions > 0 ? spendMajor / conversions : null;

  const { suggestion, reason } = decideAction({
    ctr,
    conversionRate,
    costPerConversion,
    spendCents,
    impressions,
    clicks,
  });

  const base: CampaignOptimizerResult = {
    campaignId,
    dryRun,
    recommendation: suggestion,
    suggestedAction: suggestion,
    reason,
    applied: false,
  };

  if (suggestion === "improve_copy") {
    const city = campaign.targetCity?.trim() || campaign.targetRegion?.trim() || "Québec";
    const baseIn: MarketingGeneratorInput = {
      target: "host",
      city,
      tone: "bnb",
      objective: "list_property",
    };
    const copy = generateMarketingCopy(baseIn);
    base.newCopy = {
      headline: copy.headlines[0] ?? "Stronger value prop in one line",
      body: copy.descriptions[0] ?? "Clear benefit-led description for the next creative test.",
    };
  }

  if (suggestion === "pause_campaign" && !dryRun) {
    await prisma.bnhubGrowthCampaign.update({
      where: { id: campaignId },
      data: {
        status: BnhubGrowthCampaignStatus.COMPLETED,
        completedAt: new Date(),
      },
    });
    base.applied = true;
    void trackEvent("campaign_paused_by_optimizer", { campaignId, userId, dryRun: false }).catch(
      () => {}
    );
  }

  return base;
}

function decideAction(input: {
  ctr: number;
  conversionRate: number;
  costPerConversion: number | null;
  spendCents: number;
  impressions: number;
  clicks: number;
}): { suggestion: OptimizerSuggestionAction; reason: string } {
  const { ctr, conversionRate, costPerConversion, spendCents, impressions, clicks } = input;

  if (impressions < 20 || clicks < 3) {
    return {
      suggestion: "keep_running",
      reason: "Gather more traffic before making automated changes.",
    };
  }

  if (spendCents > 5_000 && conversionRate < 0.01 && clicks > 40) {
    return {
      suggestion: "pause_campaign",
      reason: "Spend is material but conversion from clicks to conversions is very low; pausing is safer.",
    };
  }

  if (ctr < 0.006 && impressions > 150) {
    return {
      suggestion: "improve_copy",
      reason: "CTR is weak relative to scale — test fresher copy before scaling additional budget.",
    };
  }

  if (ctr > 0.02 && (costPerConversion == null || costPerConversion < 40) && spendCents < 100_000) {
    return {
      suggestion: "scale_budget",
      reason: "Creative is efficient — consider a measured budget increase on winning placements.",
    };
  }

  return {
    suggestion: "keep_running",
    reason: "Signals are in a stable band; keep monitoring and iterate weekly.",
  };
}
