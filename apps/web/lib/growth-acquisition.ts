/**
 * Growth and Acquisition Layer – referral campaigns, invite flows, onboarding, acquisition tracking.
 * Extends referral system; connects notifications and analytics.
 */
import { prisma } from "@/lib/db";
import type { GrowthCampaign, GrowthCampaignStatus } from "@prisma/client";
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
  status?: GrowthCampaignStatus;
}) {
  return prisma.growthCampaign.create({
    data: {
      name: params.name,
      campaignType: params.campaignType,
      marketId: params.marketId,
      startAt: params.startAt,
      endAt: params.endAt,
      status: params.status ?? "DRAFT",
      config: (params.config as object) ?? undefined,
    },
  });
}

export type LaunchFirstGrowthCampaignAction = "already_active" | "activated_draft" | "created_new";

/** First active acquisition campaign: activate oldest draft, or seed one; no-op if one is already ACTIVE. */
export async function launchFirstGrowthCampaign(): Promise<{
  campaign: GrowthCampaign;
  action: LaunchFirstGrowthCampaignAction;
}> {
  const active = await prisma.growthCampaign.findFirst({
    where: { status: "ACTIVE" },
    orderBy: { startAt: "asc" },
  });
  if (active) {
    return { campaign: active, action: "already_active" };
  }

  const draft = await prisma.growthCampaign.findFirst({
    where: { status: "DRAFT" },
    orderBy: { createdAt: "asc" },
  });
  if (draft) {
    const updated = await prisma.growthCampaign.update({
      where: { id: draft.id },
      data: { status: "ACTIVE" },
    });
    return { campaign: updated, action: "activated_draft" };
  }

  const endAt = new Date();
  endAt.setMonth(endAt.getMonth() + 3);
  const campaign = await prisma.growthCampaign.create({
    data: {
      name: "LECIPM — Property evaluation launch",
      campaignType: "ACQUISITION",
      startAt: new Date(),
      endAt,
      status: "ACTIVE",
      config: {
        slug: "eval_launch_v1",
        primaryPath: "/evaluate",
        description: "First-touch links: use ?source=&campaign=&medium= or utm_* on any page.",
      },
    },
  });
  return { campaign, action: "created_new" };
}

export function buildGrowthCampaignShareUrls(params: {
  baseUrl: string;
  campaign: GrowthCampaign;
}): {
  campaignSlug: string;
  evaluateMeta: string;
  evaluateUtm: string;
  homeSocial: string;
} {
  const raw = params.campaign.config as { slug?: string } | null | undefined;
  const campaignSlug = raw?.slug ?? "eval_launch_v1";
  const base = params.baseUrl.replace(/\/$/, "");
  const q1 = new URLSearchParams({
    source: "facebook",
    medium: "paid_social",
    campaign: campaignSlug,
  });
  const q2 = new URLSearchParams({
    utm_source: "google",
    utm_medium: "cpc",
    utm_campaign: campaignSlug,
  });
  const q3 = new URLSearchParams({
    source: "instagram",
    medium: "social",
    campaign: campaignSlug,
  });
  return {
    campaignSlug,
    evaluateMeta: `${base}/evaluate?${q1.toString()}`,
    evaluateUtm: `${base}/evaluate?${q2.toString()}`,
    homeSocial: `${base}/?${q3.toString()}`,
  };
}

export async function setGrowthCampaignStatus(
  id: string,
  status: GrowthCampaignStatus
): Promise<GrowthCampaign> {
  return prisma.growthCampaign.update({
    where: { id },
    data: { status },
  });
}
