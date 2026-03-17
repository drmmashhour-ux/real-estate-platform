/**
 * Growth and Acquisition Layer – referral campaigns, invite flows, onboarding, acquisition tracking.
 * Extends referral system; connects notifications and analytics.
 */
import { prisma } from "@/lib/db";
import type { GrowthCampaignStatus } from "@prisma/client";
import type { Prisma } from "@prisma/client";

export type { GrowthCampaignStatus };

/** Record acquisition source for a user (signup attribution). */
export async function recordAcquisitionSource(params: {
  userId?: string;
  campaignId?: string;
  source: string;
  medium?: string;
  utmCampaign?: string;
}) {
  return prisma.acquisitionSource.create({
    data: {
      userId: params.userId,
      campaignId: params.campaignId,
      source: params.source,
      medium: params.medium,
      utmCampaign: params.utmCampaign,
    },
  });
}

/** Get acquisition sources for user or campaign. */
export async function getAcquisitionSources(params: {
  userId?: string;
  campaignId?: string;
  limit?: number;
}) {
  const where: Prisma.AcquisitionSourceWhereInput = {};
  if (params.userId) where.userId = params.userId;
  if (params.campaignId) where.campaignId = params.campaignId;
  return prisma.acquisitionSource.findMany({
    where,
    include: { growthCampaign: { select: { name: true, campaignType: true } } },
    orderBy: { createdAt: "desc" },
    take: params.limit ?? 50,
  });
}

/** Complete onboarding milestone for user. */
export async function completeOnboardingMilestone(params: {
  userId: string;
  milestoneKey: string;
  metadata?: object;
}) {
  return prisma.onboardingMilestone.upsert({
    where: {
      userId_milestoneKey: { userId: params.userId, milestoneKey: params.milestoneKey },
    },
    create: {
      userId: params.userId,
      milestoneKey: params.milestoneKey,
      metadata: (params.metadata as object) ?? undefined,
    },
    update: { metadata: (params.metadata as object) ?? undefined },
  });
}

/** Get onboarding milestones for user. */
export async function getOnboardingMilestones(userId: string) {
  return prisma.onboardingMilestone.findMany({
    where: { userId },
    orderBy: { completedAt: "asc" },
  });
}

/** Get growth campaigns (for admin and campaign tracking). */
export async function getGrowthCampaigns(params?: {
  marketId?: string;
  status?: GrowthCampaignStatus;
  limit?: number;
}) {
  const where: Prisma.GrowthCampaignWhereInput = {};
  if (params?.marketId) where.marketId = params.marketId;
  if (params?.status) where.status = params.status;
  return prisma.growthCampaign.findMany({
    where,
    include: { market: { select: { code: true, name: true } } },
    orderBy: { startAt: "desc" },
    take: params?.limit ?? 50,
  });
}

/** Create growth campaign. */
export async function createGrowthCampaign(params: {
  name: string;
  campaignType: string;
  marketId?: string;
  startAt: Date;
  endAt: Date;
  config?: object;
}) {
  return prisma.growthCampaign.create({
    data: {
      name: params.name,
      campaignType: params.campaignType,
      marketId: params.marketId,
      startAt: params.startAt,
      endAt: params.endAt,
      status: "DRAFT",
      config: (params.config as object) ?? undefined,
    },
  });
}
