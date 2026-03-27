import type {
  GrowthContentItemStatus,
  GrowthMarketingChannelStatus,
  GrowthMarketingPlatform,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import { encryptGrowthSecret } from "@/lib/crypto/growthTokenVault";
import type { DraftPayload, PerformanceRow } from "@/src/modules/growth-automation/domain/growth-automation.types";

export async function upsertMarketingChannel(input: {
  platform: GrowthMarketingPlatform;
  externalAccountId: string;
  displayName: string;
  accessTokenPlain: string;
  refreshTokenPlain?: string | null;
  scopes: string[];
  tokenExpiresAt?: Date | null;
  status?: GrowthMarketingChannelStatus;
}) {
  return prisma.marketingChannel.upsert({
    where: {
      platform_externalAccountId: {
        platform: input.platform,
        externalAccountId: input.externalAccountId,
      },
    },
    create: {
      platform: input.platform,
      externalAccountId: input.externalAccountId,
      displayName: input.displayName,
      oauthAccessTokenEncrypted: encryptGrowthSecret(input.accessTokenPlain),
      oauthRefreshTokenEncrypted: input.refreshTokenPlain
        ? encryptGrowthSecret(input.refreshTokenPlain)
        : null,
      scopes: input.scopes,
      tokenExpiresAt: input.tokenExpiresAt ?? null,
      status: input.status ?? "CONNECTED",
    },
    update: {
      displayName: input.displayName,
      oauthAccessTokenEncrypted: encryptGrowthSecret(input.accessTokenPlain),
      oauthRefreshTokenEncrypted: input.refreshTokenPlain
        ? encryptGrowthSecret(input.refreshTokenPlain)
        : undefined,
      scopes: input.scopes,
      tokenExpiresAt: input.tokenExpiresAt ?? null,
      status: input.status ?? "CONNECTED",
    },
  });
}

export async function listMarketingChannelsSafe() {
  const rows = await prisma.marketingChannel.findMany({
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      platform: true,
      externalAccountId: true,
      displayName: true,
      scopes: true,
      tokenExpiresAt: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return rows.map((r) => ({
    ...r,
    tokenExpiresAt: r.tokenExpiresAt?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));
}

export async function getMarketingChannelById(id: string) {
  return prisma.marketingChannel.findUnique({ where: { id } });
}

export async function updateChannelTokens(
  id: string,
  tokens: {
    accessTokenPlain: string;
    refreshTokenPlain?: string | null;
    tokenExpiresAt?: Date | null;
    status?: GrowthMarketingChannelStatus;
  },
) {
  return prisma.marketingChannel.update({
    where: { id },
    data: {
      oauthAccessTokenEncrypted: encryptGrowthSecret(tokens.accessTokenPlain),
      oauthRefreshTokenEncrypted:
        tokens.refreshTokenPlain !== undefined && tokens.refreshTokenPlain !== null
          ? encryptGrowthSecret(tokens.refreshTokenPlain)
          : undefined,
      tokenExpiresAt: tokens.tokenExpiresAt ?? undefined,
      status: tokens.status,
    },
  });
}

export async function createContentItem(input: {
  contentType: string;
  topic: string;
  platform: GrowthMarketingPlatform;
  status: GrowthContentItemStatus;
  draftPayload: DraftPayload;
  marketingChannelId?: string | null;
  publishFingerprint?: string | null;
}) {
  return prisma.growthAutomationContentItem.create({
    data: {
      contentType: input.contentType,
      topic: input.topic,
      platform: input.platform,
      status: input.status,
      draftPayload: input.draftPayload as object,
      marketingChannelId: input.marketingChannelId ?? null,
      publishFingerprint: input.publishFingerprint ?? null,
    },
  });
}

export async function getContentItem(id: string) {
  return prisma.growthAutomationContentItem.findUnique({
    where: { id },
    include: { marketingChannel: true },
  });
}

export async function updateContentItemStatus(
  id: string,
  data: Partial<{
    status: GrowthContentItemStatus;
    scheduledFor: Date | null;
    publishedAt: Date | null;
    externalPostId: string | null;
    publishPayload: unknown;
    lastError: string | null;
    retryCount: number;
    draftPayload: DraftPayload;
    publishFingerprint: string | null;
    marketingChannelId: string | null;
  }>,
) {
  return prisma.growthAutomationContentItem.update({
    where: { id },
    data: {
      ...data,
      draftPayload: data.draftPayload as object | undefined,
      publishPayload: data.publishPayload as object | undefined,
    },
  });
}

export async function listContentItemsForCalendar(from: Date, to: Date) {
  return prisma.growthAutomationContentItem.findMany({
    where: {
      OR: [
        { scheduledFor: { gte: from, lte: to } },
        { publishedAt: { gte: from, lte: to } },
        { createdAt: { gte: from, lte: to } },
      ],
    },
    orderBy: [{ scheduledFor: "asc" }, { createdAt: "desc" }],
  });
}

export async function listRecentContentItems(limit = 80) {
  return prisma.growthAutomationContentItem.findMany({
    orderBy: { updatedAt: "desc" },
    take: limit,
    include: { marketingChannel: { select: { id: true, displayName: true, platform: true, status: true } } },
  });
}

/** For taxonomy rotation: recent items with payloads (newest first). */
export async function listContentItemsSince(since: Date) {
  return prisma.growthAutomationContentItem.findMany({
    where: { createdAt: { gte: since } },
    select: { draftPayload: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 400,
  });
}

export async function findPublishedDuplicateFingerprint(fingerprint: string, excludeId: string) {
  if (!fingerprint) return null;
  return prisma.growthAutomationContentItem.findFirst({
    where: {
      publishFingerprint: fingerprint,
      status: "PUBLISHED",
      NOT: { id: excludeId },
    },
  });
}

export async function listRecentFingerprints(platform: GrowthMarketingPlatform, day: string) {
  const start = new Date(`${day}T00:00:00.000Z`);
  const end = new Date(`${day}T23:59:59.999Z`);
  const rows = await prisma.growthAutomationContentItem.findMany({
    where: {
      platform,
      publishFingerprint: { not: null },
      OR: [{ scheduledFor: { gte: start, lte: end } }, { publishedAt: { gte: start, lte: end } }],
    },
    select: { publishFingerprint: true },
  });
  return new Set(rows.map((r) => r.publishFingerprint).filter(Boolean) as string[]);
}

export async function upsertPerformanceMetric(row: PerformanceRow) {
  const metricDate = new Date(row.metricDate);
  return prisma.contentPerformanceMetric.upsert({
    where: {
      contentItemId_metricDate: {
        contentItemId: row.contentItemId,
        metricDate,
      },
    },
    create: {
      contentItemId: row.contentItemId,
      platform: row.platform,
      metricDate,
      views: row.views,
      impressions: row.impressions ?? null,
      likes: row.likes ?? null,
      comments: row.comments ?? null,
      shares: row.shares ?? null,
      clicks: row.clicks ?? null,
      conversions: row.conversions ?? null,
    },
    update: {
      views: row.views,
      impressions: row.impressions ?? undefined,
      likes: row.likes ?? undefined,
      comments: row.comments ?? undefined,
      shares: row.shares ?? undefined,
      clicks: row.clicks ?? undefined,
      conversions: row.conversions ?? undefined,
    },
  });
}

export async function listPerformanceMetrics(limit = 200) {
  return prisma.contentPerformanceMetric.findMany({
    orderBy: { metricDate: "desc" },
    take: limit,
    include: { contentItem: { select: { topic: true, platform: true } } },
  });
}

export async function listPerformanceForOptimization() {
  return prisma.contentPerformanceMetric.findMany({
    orderBy: { metricDate: "desc" },
    take: 500,
    include: {
      contentItem: { select: { topic: true, platform: true, draftPayload: true } },
    },
  });
}
