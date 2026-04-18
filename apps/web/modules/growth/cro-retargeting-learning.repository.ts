/**
 * LECIPM PLATFORM — durable CRO + retargeting learning persistence (DTOs; no raw Prisma to UI).
 */
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export type CroLearningSignalDTO = {
  id: string;
  sourceGrowthEventId: string | null;
  listingId: string | null;
  sessionId: string | null;
  userId: string | null;
  ctaId: string | null;
  ctaVariant: string | null;
  ctaPosition: string | null;
  trustBlock: boolean | null;
  trustVariant: string | null;
  urgencyShown: boolean | null;
  urgencyType: string | null;
  signalType: string;
  confidenceScore: number;
  evidenceScore: number | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
};

export type RetargetingLearningSignalDTO = {
  id: string;
  sourceGrowthEventId: string | null;
  segment: string | null;
  messageId: string | null;
  messageVariant: string | null;
  urgency: string | null;
  sessionId: string | null;
  userId: string | null;
  signalType: string;
  confidenceScore: number;
  evidenceScore: number | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
};

export type RetargetingPerformanceRowDTO = {
  id: string;
  segment: string;
  messageId: string;
  messageVariant: string | null;
  impressions: number;
  clicks: number;
  bookings: number;
  conversionRate: number | null;
  qualityScore: number | null;
  metadata: Record<string, unknown> | null;
  updatedAt: Date;
};

export type CreateCroSignalInput = {
  sourceGrowthEventId?: string | null;
  /** Optional trace id (often same as sourceGrowthEventId / growth_events.id). */
  growthEventId?: string | null;
  listingId?: string | null;
  sessionId?: string | null;
  userId?: string | null;
  ctaId?: string | null;
  ctaVariant?: string | null;
  ctaPosition?: string | null;
  trustBlock?: boolean | null;
  trustVariant?: string | null;
  urgencyShown?: boolean | null;
  urgencyType?: string | null;
  signalType: string;
  confidenceScore: number;
  evidenceScore?: number | null;
  evidenceQuality?: string | null;
  metadata?: Record<string, unknown> | null;
};

export type CreateRetargetingSignalInput = {
  sourceGrowthEventId?: string | null;
  growthEventId?: string | null;
  segment?: string | null;
  messageId?: string | null;
  messageVariant?: string | null;
  urgency?: string | null;
  sessionId?: string | null;
  userId?: string | null;
  signalType: string;
  confidenceScore: number;
  evidenceScore?: number | null;
  evidenceQuality?: string | null;
  metadata?: Record<string, unknown> | null;
};

export type UpsertRetargetingPerformanceInput = {
  segment: string;
  messageId: string;
  messageVariant?: string | null;
  impressions: number;
  clicks: number;
  bookings: number;
  conversionRate?: number | null;
  qualityScore?: number | null;
  metadata?: Record<string, unknown> | null;
};

function metaObj(m: Prisma.JsonValue | null): Record<string, unknown> | null {
  if (m && typeof m === "object" && !Array.isArray(m)) return m as Record<string, unknown>;
  return null;
}

function rowCro(r: {
  id: string;
  sourceGrowthEventId: string | null;
  listingId: string | null;
  sessionId: string | null;
  userId: string | null;
  ctaId: string | null;
  ctaVariant: string | null;
  ctaPosition: string | null;
  trustBlock: boolean | null;
  trustVariant: string | null;
  urgencyShown: boolean | null;
  urgencyType: string | null;
  signalType: string;
  confidenceScore: number;
  evidenceScore: number | null;
  metadata: Prisma.JsonValue | null;
  createdAt: Date;
}): CroLearningSignalDTO {
  return {
    id: r.id,
    sourceGrowthEventId: r.sourceGrowthEventId,
    listingId: r.listingId,
    sessionId: r.sessionId,
    userId: r.userId,
    ctaId: r.ctaId,
    ctaVariant: r.ctaVariant,
    ctaPosition: r.ctaPosition,
    trustBlock: r.trustBlock,
    trustVariant: r.trustVariant,
    urgencyShown: r.urgencyShown,
    urgencyType: r.urgencyType,
    signalType: r.signalType,
    confidenceScore: r.confidenceScore,
    evidenceScore: r.evidenceScore,
    metadata: metaObj(r.metadata),
    createdAt: r.createdAt,
  };
}

function rowRt(r: {
  id: string;
  sourceGrowthEventId: string | null;
  segment: string | null;
  messageId: string | null;
  messageVariant: string | null;
  urgency: string | null;
  sessionId: string | null;
  userId: string | null;
  signalType: string;
  confidenceScore: number;
  evidenceScore: number | null;
  metadata: Prisma.JsonValue | null;
  createdAt: Date;
}): RetargetingLearningSignalDTO {
  return {
    id: r.id,
    sourceGrowthEventId: r.sourceGrowthEventId,
    segment: r.segment,
    messageId: r.messageId,
    messageVariant: r.messageVariant,
    urgency: r.urgency,
    sessionId: r.sessionId,
    userId: r.userId,
    signalType: r.signalType,
    confidenceScore: r.confidenceScore,
    evidenceScore: r.evidenceScore,
    metadata: metaObj(r.metadata),
    createdAt: r.createdAt,
  };
}

export async function createCroSignals(rows: CreateCroSignalInput[]): Promise<{ created: number }> {
  if (rows.length === 0) return { created: 0 };
  const data = rows
    .filter((r) => r.signalType?.trim())
    .map((r) => ({
      sourceGrowthEventId: r.sourceGrowthEventId ?? undefined,
      growthEventId: r.growthEventId ?? r.sourceGrowthEventId ?? undefined,
      listingId: r.listingId ?? undefined,
      sessionId: r.sessionId ?? undefined,
      userId: r.userId ?? undefined,
      ctaId: r.ctaId ?? undefined,
      ctaVariant: r.ctaVariant ?? undefined,
      ctaPosition: r.ctaPosition ?? undefined,
      trustBlock: r.trustBlock ?? undefined,
      trustVariant: r.trustVariant ?? undefined,
      urgencyShown: r.urgencyShown ?? undefined,
      urgencyType: r.urgencyType ?? undefined,
      signalType: r.signalType,
      confidenceScore: r.confidenceScore,
      evidenceScore: r.evidenceScore ?? undefined,
      evidenceQuality: r.evidenceQuality ?? undefined,
      metadata: r.metadata ? (r.metadata as Prisma.InputJsonValue) : undefined,
    }));
  if (data.length === 0) return { created: 0 };
  const res = await prisma.croLearningSignal.createMany({ data, skipDuplicates: true });
  return { created: res.count };
}

export async function createRetargetingSignals(rows: CreateRetargetingSignalInput[]): Promise<{ created: number }> {
  if (rows.length === 0) return { created: 0 };
  const data = rows
    .filter((r) => r.signalType?.trim())
    .map((r) => ({
      sourceGrowthEventId: r.sourceGrowthEventId ?? undefined,
      segment: r.segment ?? undefined,
      messageId: r.messageId ?? undefined,
      messageVariant: r.messageVariant ?? undefined,
      urgency: r.urgency ?? undefined,
      sessionId: r.sessionId ?? undefined,
      userId: r.userId ?? undefined,
      signalType: r.signalType,
      confidenceScore: r.confidenceScore,
      evidenceScore: r.evidenceScore ?? undefined,
      metadata: r.metadata ? (r.metadata as Prisma.InputJsonValue) : undefined,
    }));
  if (data.length === 0) return { created: 0 };
  const res = await prisma.retargetingLearningSignal.createMany({ data, skipDuplicates: true });
  return { created: res.count };
}

export async function upsertRetargetingPerformance(rows: UpsertRetargetingPerformanceInput[]): Promise<void> {
  for (const r of rows) {
    const cr =
      r.clicks > 0 ? r.bookings / r.clicks
      : r.conversionRate != null ? r.conversionRate
      : null;
    await prisma.retargetingPerformanceSnapshot.upsert({
      where: {
        segment_messageId: { segment: r.segment, messageId: r.messageId },
      },
      create: {
        segment: r.segment,
        messageId: r.messageId,
        messageVariant: r.messageVariant ?? undefined,
        impressions: r.impressions,
        clicks: r.clicks,
        bookings: r.bookings,
        conversionRate: cr ?? undefined,
        qualityScore: r.qualityScore ?? undefined,
        evidenceScore: r.evidenceScore ?? undefined,
        evidenceQuality: r.evidenceQuality ?? undefined,
        metadata: r.metadata ? (r.metadata as Prisma.InputJsonValue) : undefined,
      },
      update: {
        messageVariant: r.messageVariant ?? undefined,
        impressions: r.impressions,
        clicks: r.clicks,
        bookings: r.bookings,
        conversionRate: cr ?? undefined,
        qualityScore: r.qualityScore ?? undefined,
        evidenceScore: r.evidenceScore ?? undefined,
        evidenceQuality: r.evidenceQuality ?? undefined,
        metadata: r.metadata ? (r.metadata as Prisma.InputJsonValue) : undefined,
      },
    });
  }
}

export async function getCroSignals(filters?: {
  signalType?: string;
  since?: Date;
  limit?: number;
}): Promise<CroLearningSignalDTO[]> {
  const limit = filters?.limit ?? 500;
  const rows = await prisma.croLearningSignal.findMany({
    where: {
      ...(filters?.signalType ? { signalType: filters.signalType } : {}),
      ...(filters?.since ? { createdAt: { gte: filters.since } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return rows.map(rowCro);
}

export async function getRetargetingSignals(filters?: {
  segment?: string;
  since?: Date;
  limit?: number;
}): Promise<RetargetingLearningSignalDTO[]> {
  const limit = filters?.limit ?? 500;
  const rows = await prisma.retargetingLearningSignal.findMany({
    where: {
      ...(filters?.segment ? { segment: filters.segment } : {}),
      ...(filters?.since ? { createdAt: { gte: filters.since } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return rows.map(rowRt);
}

export async function getRetargetingPerformanceBySegment(segment: string): Promise<RetargetingPerformanceRowDTO[]> {
  const rows = await prisma.retargetingPerformanceSnapshot.findMany({
    where: { segment },
    orderBy: { updatedAt: "desc" },
  });
  return rows.map((r) => ({
    id: r.id,
    segment: r.segment,
    messageId: r.messageId,
    messageVariant: r.messageVariant,
    impressions: r.impressions,
    clicks: r.clicks,
    bookings: r.bookings,
    conversionRate: r.conversionRate,
    qualityScore: r.qualityScore,
    evidenceScore: r.evidenceScore ?? null,
    evidenceQuality: r.evidenceQuality ?? null,
    metadata: metaObj(r.metadata),
    updatedAt: r.updatedAt,
  }));
}

export async function getTopRetargetingMessagesBySegment(
  segment: string,
  limit = 8,
): Promise<RetargetingPerformanceRowDTO[]> {
  const rows = await prisma.retargetingPerformanceSnapshot.findMany({
    where: { segment, clicks: { gte: 1 } },
    orderBy: [{ conversionRate: "desc" }, { bookings: "desc" }],
    take: limit,
  });
  return rows.map((r) => ({
    id: r.id,
    segment: r.segment,
    messageId: r.messageId,
    messageVariant: r.messageVariant,
    impressions: r.impressions,
    clicks: r.clicks,
    bookings: r.bookings,
    conversionRate: r.conversionRate,
    qualityScore: r.qualityScore,
    evidenceScore: r.evidenceScore ?? null,
    evidenceQuality: r.evidenceQuality ?? null,
    metadata: metaObj(r.metadata),
    updatedAt: r.updatedAt,
  }));
}

export async function getWeakRetargetingMessages(limit = 40): Promise<RetargetingPerformanceRowDTO[]> {
  const rows = await prisma.retargetingPerformanceSnapshot.findMany({
    where: {
      clicks: { gte: 20 },
      bookings: 0,
      conversionRate: { lt: 0.02 },
    },
    orderBy: { clicks: "desc" },
    take: limit,
  });
  return rows.map((r) => ({
    id: r.id,
    segment: r.segment,
    messageId: r.messageId,
    messageVariant: r.messageVariant,
    impressions: r.impressions,
    clicks: r.clicks,
    bookings: r.bookings,
    conversionRate: r.conversionRate,
    qualityScore: r.qualityScore,
    evidenceScore: r.evidenceScore ?? null,
    evidenceQuality: r.evidenceQuality ?? null,
    metadata: metaObj(r.metadata),
    updatedAt: r.updatedAt,
  }));
}

export type SignalSummary = {
  total: number;
  bySignalType: Record<string, number>;
  lastCreatedAt: string | null;
};

export async function getRecentCroSignalSummary(sinceDays = 14): Promise<SignalSummary> {
  const since = new Date(Date.now() - sinceDays * 864e5);
  const rows = await prisma.croLearningSignal.findMany({
    where: { createdAt: { gte: since } },
    select: { signalType: true, createdAt: true },
  });
  const bySignalType: Record<string, number> = {};
  let last: Date | null = null;
  for (const r of rows) {
    bySignalType[r.signalType] = (bySignalType[r.signalType] ?? 0) + 1;
    if (!last || r.createdAt > last) last = r.createdAt;
  }
  return {
    total: rows.length,
    bySignalType,
    lastCreatedAt: last?.toISOString() ?? null,
  };
}

export async function getRecentRetargetingSignalSummary(sinceDays = 14): Promise<SignalSummary> {
  const since = new Date(Date.now() - sinceDays * 864e5);
  const rows = await prisma.retargetingLearningSignal.findMany({
    where: { createdAt: { gte: since } },
    select: { signalType: true, createdAt: true },
  });
  const bySignalType: Record<string, number> = {};
  let last: Date | null = null;
  for (const r of rows) {
    bySignalType[r.signalType] = (bySignalType[r.signalType] ?? 0) + 1;
    if (!last || r.createdAt > last) last = r.createdAt;
  }
  return {
    total: rows.length,
    bySignalType,
    lastCreatedAt: last?.toISOString() ?? null,
  };
}

export async function listAllRetargetingPerformanceSnapshots(): Promise<RetargetingPerformanceRowDTO[]> {
  const rows = await prisma.retargetingPerformanceSnapshot.findMany({ orderBy: { updatedAt: "desc" } });
  return rows.map((r) => ({
    id: r.id,
    segment: r.segment,
    messageId: r.messageId,
    messageVariant: r.messageVariant,
    impressions: r.impressions,
    clicks: r.clicks,
    bookings: r.bookings,
    conversionRate: r.conversionRate,
    qualityScore: r.qualityScore,
    evidenceScore: r.evidenceScore ?? null,
    evidenceQuality: r.evidenceQuality ?? null,
    metadata: metaObj(r.metadata),
    updatedAt: r.updatedAt,
  }));
}
