import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { DailyContentPlan } from "@/src/modules/ai-growth-engine/domain/growth.types";

export async function saveContentPlan(plan: DailyContentPlan) {
  const planDate = new Date(plan.planDate + "T12:00:00.000Z");
  return prisma.aiGrowthContentPlan.upsert({
    where: { planDate },
    create: {
      planDate,
      topic: plan.slots[0]?.topic ?? "Daily plan",
      summary: plan.brandVoice,
      planJson: plan as unknown as Prisma.InputJsonValue,
      status: "draft",
    },
    update: {
      topic: plan.slots[0]?.topic ?? "Daily plan",
      summary: plan.brandVoice,
      planJson: plan as unknown as Prisma.InputJsonValue,
    },
  });
}

export async function listRecentPlans(take = 14) {
  return prisma.aiGrowthContentPlan.findMany({
    orderBy: { planDate: "desc" },
    take,
    include: { items: { orderBy: { scheduledAt: "asc" } } },
  });
}

export async function createItem(args: {
  planId: string;
  platform: string;
  contentType: string;
  payloadJson: Record<string, unknown>;
  scheduledAt?: Date | null;
}) {
  return prisma.aiGrowthContentItem.create({
    data: {
      planId: args.planId,
      platform: args.platform,
      contentType: args.contentType,
      payloadJson: args.payloadJson as Prisma.InputJsonValue,
      scheduledAt: args.scheduledAt ?? null,
      status: "draft",
    },
  });
}

export async function approveItem(itemId: string, adminUserId: string) {
  return prisma.aiGrowthContentItem.update({
    where: { id: itemId },
    data: {
      status: "approved",
      humanApprovedAt: new Date(),
      humanApprovedById: adminUserId,
    },
  });
}

export async function markPublished(itemId: string) {
  return prisma.aiGrowthContentItem.update({
    where: { id: itemId },
    data: { status: "published", publishedAt: new Date() },
  });
}

export async function upsertPerformance(args: {
  itemId: string;
  snapshotDate: Date;
  views: number;
  clicks: number;
  conversions: number;
  engagementScore: number;
  rawJson?: Record<string, unknown>;
}) {
  return prisma.aiGrowthPerformanceSnapshot.upsert({
    where: {
      itemId_snapshotDate: { itemId: args.itemId, snapshotDate: args.snapshotDate },
    },
    create: {
      itemId: args.itemId,
      snapshotDate: args.snapshotDate,
      views: args.views,
      clicks: args.clicks,
      conversions: args.conversions,
      engagementScore: args.engagementScore,
      rawJson: (args.rawJson ?? undefined) as Prisma.InputJsonValue | undefined,
    },
    update: {
      views: args.views,
      clicks: args.clicks,
      conversions: args.conversions,
      engagementScore: args.engagementScore,
      rawJson: (args.rawJson ?? undefined) as Prisma.InputJsonValue | undefined,
    },
  });
}

export async function listPerformanceForPlan(planId: string) {
  return prisma.aiGrowthPerformanceSnapshot.findMany({
    where: { item: { planId } },
    orderBy: { snapshotDate: "desc" },
    include: { item: true },
    take: 200,
  });
}
