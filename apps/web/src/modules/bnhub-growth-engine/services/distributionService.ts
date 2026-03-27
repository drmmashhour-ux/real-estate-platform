import { prisma } from "@/lib/db";
import {
  createDistributionPlan,
  publishDistribution,
} from "./growthCampaignService";
import { appendGrowthAuditLog } from "./growthAuditService";
import { getGrowthFeaturedListingIds, getGrowthSearchBoostByListingId } from "./growthFeaturedBridge";

export { createDistributionPlan, publishDistribution };

export async function queueDistribution(distributionId: string, scheduledAt: Date) {
  return prisma.bnhubGrowthDistribution.update({
    where: { id: distributionId },
    data: { distributionStatus: "SCHEDULED", scheduledAt },
  });
}

export async function markDistributionPublished(distributionId: string) {
  return prisma.bnhubGrowthDistribution.update({
    where: { id: distributionId },
    data: { distributionStatus: "PUBLISHED", publishedAt: new Date() },
  });
}

export async function markDistributionFailed(distributionId: string, summary: string) {
  return prisma.bnhubGrowthDistribution.update({
    where: { id: distributionId },
    data: { distributionStatus: "FAILED", responseSummary: summary },
  });
}

export async function executeDistribution(
  distributionId: string,
  opts: { adminApprovedExternal?: boolean; confirmIrreversibleExternal?: boolean; actorId?: string | null }
) {
  return publishDistribution(distributionId, opts);
}

export async function applyInternalHomepagePromotion(): Promise<{ featuredListingIds: string[] }> {
  const featuredListingIds = await getGrowthFeaturedListingIds(48);
  return { featuredListingIds };
}

export async function applyInternalSearchBoost(): Promise<Map<string, number>> {
  return getGrowthSearchBoostByListingId();
}

/** Queue record = audit + placeholder payload (real mailer integration TBD). */
export async function queueInternalEmailCampaign(campaignId: string, listingId: string) {
  await appendGrowthAuditLog({
    actorType: "SYSTEM",
    entityType: "bnhub_growth_campaign",
    entityId: campaignId,
    actionType: "internal_email_queued",
    actionSummary: `Internal email card queued for listing ${listingId}`,
    afterJson: { listingId, mock: true },
  });
  return { ok: true as const, mock: true as const, message: "BNHub email queue — wire to bnhub_email_campaign_queue when enabled" };
}
