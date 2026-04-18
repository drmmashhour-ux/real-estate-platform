/**
 * Profit Engine V2 — durable snapshots, trends, learning (DTOs only; no raw Prisma leakage).
 */
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export type CampaignProfitSnapshotDTO = {
  id: string;
  campaignKey: string;
  impressions: number;
  clicks: number;
  leads: number;
  bookings: number;
  spend: number;
  cpl: number | null;
  ltvEstimate: number | null;
  ltvToCplRatio: number | null;
  profitPerLead: number | null;
  status: string;
  confidenceScore: number;
  evidenceQuality: string;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
};

export type CampaignProfitTrendDTO = {
  id: string;
  campaignKey: string;
  day: Date;
  profitPerLead: number | null;
  ltvToCplRatio: number | null;
  spend: number;
  leads: number;
  bookings: number;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
};

export type CampaignProfitLearningDTO = {
  id: string;
  campaignKey: string;
  signalType: string;
  confidenceScore: number;
  evidenceScore: number;
  reason: string;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
};

function metaObj(m: Prisma.JsonValue | null): Record<string, unknown> | null {
  if (m && typeof m === "object" && !Array.isArray(m)) return m as Record<string, unknown>;
  return null;
}

function mapSnap(r: {
  id: string;
  campaignKey: string;
  impressions: number;
  clicks: number;
  leads: number;
  bookings: number;
  spend: number;
  cpl: number | null;
  ltvEstimate: number | null;
  ltvToCplRatio: number | null;
  profitPerLead: number | null;
  status: string;
  confidenceScore: number;
  evidenceQuality: string;
  metadata: Prisma.JsonValue | null;
  createdAt: Date;
}): CampaignProfitSnapshotDTO {
  return {
    id: r.id,
    campaignKey: r.campaignKey,
    impressions: r.impressions,
    clicks: r.clicks,
    leads: r.leads,
    bookings: r.bookings,
    spend: r.spend,
    cpl: r.cpl,
    ltvEstimate: r.ltvEstimate,
    ltvToCplRatio: r.ltvToCplRatio,
    profitPerLead: r.profitPerLead,
    status: r.status,
    confidenceScore: r.confidenceScore,
    evidenceQuality: r.evidenceQuality,
    metadata: metaObj(r.metadata),
    createdAt: r.createdAt,
  };
}

export type CreateProfitSnapshotInput = Omit<CampaignProfitSnapshotDTO, "id" | "createdAt"> & {
  metadata?: Record<string, unknown> | null;
};

export type CreateProfitTrendInput = {
  campaignKey: string;
  day: Date;
  profitPerLead: number | null;
  ltvToCplRatio: number | null;
  spend: number;
  leads: number;
  bookings: number;
  metadata?: Record<string, unknown> | null;
};

export type CreateProfitLearningInput = {
  campaignKey: string;
  signalType: string;
  confidenceScore: number;
  evidenceScore: number;
  reason: string;
  metadata?: Record<string, unknown> | null;
};

export async function createProfitSnapshots(rows: CreateProfitSnapshotInput[]): Promise<{ created: number }> {
  if (rows.length === 0) return { created: 0 };
  await prisma.campaignProfitSnapshot.createMany({
    data: rows.map((r) => ({
      campaignKey: r.campaignKey,
      impressions: r.impressions,
      clicks: r.clicks,
      leads: r.leads,
      bookings: r.bookings,
      spend: r.spend,
      cpl: r.cpl ?? undefined,
      ltvEstimate: r.ltvEstimate ?? undefined,
      ltvToCplRatio: r.ltvToCplRatio ?? undefined,
      profitPerLead: r.profitPerLead ?? undefined,
      status: r.status,
      confidenceScore: r.confidenceScore,
      evidenceQuality: r.evidenceQuality,
      metadata: r.metadata ? (r.metadata as Prisma.InputJsonValue) : undefined,
    })),
  });
  return { created: rows.length };
}

export async function createProfitTrendRows(rows: CreateProfitTrendInput[]): Promise<{ upserted: number }> {
  let n = 0;
  for (const r of rows) {
    await prisma.campaignProfitTrend.upsert({
      where: {
        campaignKey_day: { campaignKey: r.campaignKey, day: r.day },
      },
      create: {
        campaignKey: r.campaignKey,
        day: r.day,
        profitPerLead: r.profitPerLead ?? undefined,
        ltvToCplRatio: r.ltvToCplRatio ?? undefined,
        spend: r.spend,
        leads: r.leads,
        bookings: r.bookings,
        metadata: r.metadata ? (r.metadata as Prisma.InputJsonValue) : undefined,
      },
      update: {
        profitPerLead: r.profitPerLead ?? undefined,
        ltvToCplRatio: r.ltvToCplRatio ?? undefined,
        spend: r.spend,
        leads: r.leads,
        bookings: r.bookings,
        metadata: r.metadata ? (r.metadata as Prisma.InputJsonValue) : undefined,
      },
    });
    n += 1;
  }
  return { upserted: n };
}

export async function createProfitLearningSignals(rows: CreateProfitLearningInput[]): Promise<{ created: number }> {
  if (rows.length === 0) return { created: 0 };
  await prisma.campaignProfitLearning.createMany({
    data: rows.map((r) => ({
      campaignKey: r.campaignKey,
      signalType: r.signalType,
      confidenceScore: r.confidenceScore,
      evidenceScore: r.evidenceScore,
      reason: r.reason,
      metadata: r.metadata ? (r.metadata as Prisma.InputJsonValue) : undefined,
    })),
  });
  return { created: rows.length };
}

export async function getLatestProfitByCampaign(campaignKey: string): Promise<CampaignProfitSnapshotDTO | null> {
  const r = await prisma.campaignProfitSnapshot.findFirst({
    where: { campaignKey },
    orderBy: { createdAt: "desc" },
  });
  return r ? mapSnap(r) : null;
}

export async function getProfitTrend(campaignKey: string, rangeDays = 14): Promise<CampaignProfitTrendDTO[]> {
  const since = new Date(Date.now() - rangeDays * 864e5);
  const rows = await prisma.campaignProfitTrend.findMany({
    where: { campaignKey, day: { gte: since } },
    orderBy: { day: "asc" },
  });
  return rows.map((row) => ({
    id: row.id,
    campaignKey: row.campaignKey,
    day: row.day,
    profitPerLead: row.profitPerLead,
    ltvToCplRatio: row.ltvToCplRatio,
    spend: row.spend,
    leads: row.leads,
    bookings: row.bookings,
    metadata: metaObj(row.metadata),
    createdAt: row.createdAt,
  }));
}

export async function getTopProfitableCampaigns(limit = 10): Promise<CampaignProfitSnapshotDTO[]> {
  const since = new Date(Date.now() - 14 * 864e5);
  const recent = await prisma.campaignProfitSnapshot.findMany({
    where: { createdAt: { gte: since }, ltvToCplRatio: { not: null } },
    orderBy: { createdAt: "desc" },
    take: 500,
  });
  const bestByKey = new Map<string, (typeof recent)[0]>();
  for (const row of recent) {
    const cur = bestByKey.get(row.campaignKey);
    const score = row.ltvToCplRatio ?? 0;
    if (!cur || (cur.ltvToCplRatio ?? 0) < score) bestByKey.set(row.campaignKey, row);
  }
  const sorted = [...bestByKey.values()]
    .filter((r) => r.ltvToCplRatio != null && r.ltvToCplRatio > 1)
    .sort((a, b) => (b.ltvToCplRatio ?? 0) - (a.ltvToCplRatio ?? 0))
    .slice(0, limit);
  return sorted.map(mapSnap);
}

export async function getUnprofitableCampaigns(limit = 10): Promise<CampaignProfitSnapshotDTO[]> {
  const since = new Date(Date.now() - 14 * 864e5);
  const recent = await prisma.campaignProfitSnapshot.findMany({
    where: { createdAt: { gte: since }, ltvToCplRatio: { not: null } },
    orderBy: { createdAt: "desc" },
    take: 500,
  });
  const worstByKey = new Map<string, (typeof recent)[0]>();
  for (const row of recent) {
    const cur = worstByKey.get(row.campaignKey);
    const score = row.ltvToCplRatio ?? 999;
    if (!cur || (cur.ltvToCplRatio ?? 999) > score) worstByKey.set(row.campaignKey, row);
  }
  const sorted = [...worstByKey.values()]
    .filter((r) => r.ltvToCplRatio != null && r.ltvToCplRatio < 1)
    .sort((a, b) => (a.ltvToCplRatio ?? 0) - (b.ltvToCplRatio ?? 0))
    .slice(0, limit);
  return sorted.map(mapSnap);
}

export async function getProfitEngineHealth(): Promise<{
  snapshotRows14d: number;
  trendRows14d: number;
  learningRows14d: number;
  lastSnapshotAt: string | null;
}> {
  const since = new Date(Date.now() - 14 * 864e5);
  const [snapshotRows14d, trendRows14d, learningRows14d, lastSnap] = await Promise.all([
    prisma.campaignProfitSnapshot.count({ where: { createdAt: { gte: since } } }),
    prisma.campaignProfitTrend.count({ where: { createdAt: { gte: since } } }),
    prisma.campaignProfitLearning.count({ where: { createdAt: { gte: since } } }),
    prisma.campaignProfitSnapshot.findFirst({ orderBy: { createdAt: "desc" }, select: { createdAt: true } }),
  ]);
  return {
    snapshotRows14d,
    trendRows14d,
    learningRows14d,
    lastSnapshotAt: lastSnap?.createdAt.toISOString() ?? null,
  };
}
