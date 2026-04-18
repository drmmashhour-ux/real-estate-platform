/**
 * LECIPM — CRO + retargeting durability facade (DTOs; typed lists; wraps Phase 2 repository + low-conversion snapshots).
 */
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import {
  createCroSignals,
  createRetargetingSignals,
  getCroSignals,
  getRecentCroSignalSummary,
  getRecentRetargetingSignalSummary,
  getRetargetingPerformanceBySegment,
  getRetargetingSignals,
  getTopRetargetingMessagesBySegment,
  getWeakRetargetingMessages,
  listAllRetargetingPerformanceSnapshots,
  upsertRetargetingPerformance,
  type CreateCroSignalInput,
  type CreateRetargetingSignalInput,
  type CroLearningSignalDTO,
  type RetargetingLearningSignalDTO,
  type RetargetingPerformanceRowDTO,
  type UpsertRetargetingPerformanceInput,
} from "./cro-retargeting-learning.repository";

export type CroLowConversionSnapshotDTO = {
  id: string;
  groupKey: string;
  listingId: string | null;
  ctaVariant: string | null;
  trustVariant: string | null;
  urgencyType: string | null;
  impressions: number;
  clicks: number;
  leads: number;
  bookings: number;
  conversionRate: number | null;
  evidenceScore: number;
  evidenceQuality: string;
  reasons: unknown;
  warnings: unknown;
  metadata: Record<string, unknown> | null;
  updatedAt: Date;
};

export type RetargetingLowConversionSnapshotDTO = {
  id: string;
  groupKey: string;
  segment: string | null;
  messageId: string | null;
  messageVariant: string | null;
  impressions: number;
  clicks: number;
  bookings: number;
  conversionRate: number | null;
  evidenceScore: number;
  evidenceQuality: string;
  reasons: unknown;
  warnings: unknown;
  metadata: Record<string, unknown> | null;
  updatedAt: Date;
};

export type DurabilityHealthDTO = {
  croSignalRows14d: number;
  retargetingSignalRows14d: number;
  croLowSnapshots: number;
  retargetingLowSnapshots: number;
  performanceSnapshots: number;
  lastCroSignalAt: string | null;
  lastRtSignalAt: string | null;
};

function metaObj(m: Prisma.JsonValue | null): Record<string, unknown> | null {
  if (m && typeof m === "object" && !Array.isArray(m)) return m as Record<string, unknown>;
  return null;
}

/** Alias — same as `createCroSignals` in Phase 2 repository. */
export async function createCroLearningSignals(rows: CreateCroSignalInput[]): Promise<{ created: number }> {
  return createCroSignals(rows);
}

export async function createRetargetingLearningSignals(
  rows: CreateRetargetingSignalInput[],
): Promise<{ created: number }> {
  return createRetargetingSignals(rows);
}

export async function upsertRetargetingPerformanceSnapshots(rows: UpsertRetargetingPerformanceInput[]): Promise<void> {
  await upsertRetargetingPerformance(rows);
}

export type UpsertCroLowSnapshotInput = {
  groupKey: string;
  listingId?: string | null;
  ctaVariant?: string | null;
  trustVariant?: string | null;
  urgencyType?: string | null;
  impressions: number;
  clicks: number;
  leads: number;
  bookings: number;
  conversionRate?: number | null;
  evidenceScore: number;
  evidenceQuality: string;
  reasons?: unknown;
  warnings?: unknown;
  metadata?: Record<string, unknown> | null;
};

export type UpsertRtLowSnapshotInput = {
  groupKey: string;
  segment?: string | null;
  messageId?: string | null;
  messageVariant?: string | null;
  impressions: number;
  clicks: number;
  bookings: number;
  conversionRate?: number | null;
  evidenceScore: number;
  evidenceQuality: string;
  reasons?: unknown;
  warnings?: unknown;
  metadata?: Record<string, unknown> | null;
};

export async function upsertCroLowConversionSnapshots(rows: UpsertCroLowSnapshotInput[]): Promise<{ upserted: number }> {
  let upserted = 0;
  for (const r of rows) {
    await prisma.croLowConversionSnapshot.upsert({
      where: { groupKey: r.groupKey },
      create: {
        groupKey: r.groupKey,
        listingId: r.listingId ?? undefined,
        ctaVariant: r.ctaVariant ?? undefined,
        trustVariant: r.trustVariant ?? undefined,
        urgencyType: r.urgencyType ?? undefined,
        impressions: r.impressions,
        clicks: r.clicks,
        leads: r.leads,
        bookings: r.bookings,
        conversionRate: r.conversionRate ?? undefined,
        evidenceScore: r.evidenceScore,
        evidenceQuality: r.evidenceQuality,
        reasons: r.reasons === undefined ? undefined : (r.reasons as Prisma.InputJsonValue),
        warnings: r.warnings === undefined ? undefined : (r.warnings as Prisma.InputJsonValue),
        metadata: r.metadata ? (r.metadata as Prisma.InputJsonValue) : undefined,
      },
      update: {
        listingId: r.listingId ?? undefined,
        ctaVariant: r.ctaVariant ?? undefined,
        trustVariant: r.trustVariant ?? undefined,
        urgencyType: r.urgencyType ?? undefined,
        impressions: r.impressions,
        clicks: r.clicks,
        leads: r.leads,
        bookings: r.bookings,
        conversionRate: r.conversionRate ?? undefined,
        evidenceScore: r.evidenceScore,
        evidenceQuality: r.evidenceQuality,
        reasons: r.reasons === undefined ? undefined : (r.reasons as Prisma.InputJsonValue),
        warnings: r.warnings === undefined ? undefined : (r.warnings as Prisma.InputJsonValue),
        metadata: r.metadata ? (r.metadata as Prisma.InputJsonValue) : undefined,
      },
    });
    upserted += 1;
  }
  return { upserted };
}

export async function upsertRetargetingLowConversionSnapshots(
  rows: UpsertRtLowSnapshotInput[],
): Promise<{ upserted: number }> {
  let upserted = 0;
  for (const r of rows) {
    await prisma.retargetingLowConversionSnapshot.upsert({
      where: { groupKey: r.groupKey },
      create: {
        groupKey: r.groupKey,
        segment: r.segment ?? undefined,
        messageId: r.messageId ?? undefined,
        messageVariant: r.messageVariant ?? undefined,
        impressions: r.impressions,
        clicks: r.clicks,
        bookings: r.bookings,
        conversionRate: r.conversionRate ?? undefined,
        evidenceScore: r.evidenceScore,
        evidenceQuality: r.evidenceQuality,
        reasons: r.reasons === undefined ? undefined : (r.reasons as Prisma.InputJsonValue),
        warnings: r.warnings === undefined ? undefined : (r.warnings as Prisma.InputJsonValue),
        metadata: r.metadata ? (r.metadata as Prisma.InputJsonValue) : undefined,
      },
      update: {
        segment: r.segment ?? undefined,
        messageId: r.messageId ?? undefined,
        messageVariant: r.messageVariant ?? undefined,
        impressions: r.impressions,
        clicks: r.clicks,
        bookings: r.bookings,
        conversionRate: r.conversionRate ?? undefined,
        evidenceScore: r.evidenceScore,
        evidenceQuality: r.evidenceQuality,
        reasons: r.reasons === undefined ? undefined : (r.reasons as Prisma.InputJsonValue),
        warnings: r.warnings === undefined ? undefined : (r.warnings as Prisma.InputJsonValue),
        metadata: r.metadata ? (r.metadata as Prisma.InputJsonValue) : undefined,
      },
    });
    upserted += 1;
  }
  return { upserted };
}

export async function listCroLearningSignals(filters?: {
  signalType?: string;
  since?: Date;
  limit?: number;
}): Promise<CroLearningSignalDTO[]> {
  return getCroSignals(filters);
}

export async function listRetargetingLearningSignals(filters?: {
  segment?: string;
  since?: Date;
  limit?: number;
}): Promise<RetargetingLearningSignalDTO[]> {
  return getRetargetingSignals(filters);
}

export async function listRetargetingPerformanceSnapshots(filters?: {
  segment?: string;
  limit?: number;
}): Promise<RetargetingPerformanceRowDTO[]> {
  const limit = filters?.limit ?? 500;
  if (filters?.segment) {
    const rows = await getRetargetingPerformanceBySegment(filters.segment);
    return rows.slice(0, limit);
  }
  const all = await listAllRetargetingPerformanceSnapshots();
  return all.slice(0, limit);
}

export async function listCroLowConversionSnapshots(filters?: { limit?: number }): Promise<CroLowConversionSnapshotDTO[]> {
  const limit = filters?.limit ?? 200;
  const rows = await prisma.croLowConversionSnapshot.findMany({
    orderBy: { updatedAt: "desc" },
    take: limit,
  });
  return rows.map((r) => ({
    id: r.id,
    groupKey: r.groupKey,
    listingId: r.listingId,
    ctaVariant: r.ctaVariant,
    trustVariant: r.trustVariant,
    urgencyType: r.urgencyType,
    impressions: r.impressions,
    clicks: r.clicks,
    leads: r.leads,
    bookings: r.bookings,
    conversionRate: r.conversionRate,
    evidenceScore: r.evidenceScore,
    evidenceQuality: r.evidenceQuality,
    reasons: r.reasons,
    warnings: r.warnings,
    metadata: metaObj(r.metadata),
    updatedAt: r.updatedAt,
  }));
}

export async function listRetargetingLowConversionSnapshots(filters?: {
  limit?: number;
}): Promise<RetargetingLowConversionSnapshotDTO[]> {
  const limit = filters?.limit ?? 200;
  const rows = await prisma.retargetingLowConversionSnapshot.findMany({
    orderBy: { updatedAt: "desc" },
    take: limit,
  });
  return rows.map((r) => ({
    id: r.id,
    groupKey: r.groupKey,
    segment: r.segment,
    messageId: r.messageId,
    messageVariant: r.messageVariant,
    impressions: r.impressions,
    clicks: r.clicks,
    bookings: r.bookings,
    conversionRate: r.conversionRate,
    evidenceScore: r.evidenceScore,
    evidenceQuality: r.evidenceQuality,
    reasons: r.reasons,
    warnings: r.warnings,
    metadata: metaObj(r.metadata),
    updatedAt: r.updatedAt,
  }));
}

export async function getTopRetargetingMessagesBySegmentDurability(
  segment: string,
  limit?: number,
): Promise<RetargetingPerformanceRowDTO[]> {
  return getTopRetargetingMessagesBySegment(segment, limit ?? 8);
}

export async function getWeakRetargetingMessagesDurability(limit?: number): Promise<RetargetingPerformanceRowDTO[]> {
  return getWeakRetargetingMessages(limit ?? 40);
}

export async function getRecentCroLearningSummary(): Promise<Awaited<ReturnType<typeof getRecentCroSignalSummary>>> {
  return getRecentCroSignalSummary(14);
}

export async function getRecentRetargetingLearningSummary(): Promise<
  Awaited<ReturnType<typeof getRecentRetargetingSignalSummary>>
> {
  return getRecentRetargetingSignalSummary(14);
}

export async function getDurabilityHealth(): Promise<DurabilityHealthDTO> {
  const [croS, rtS, croLow, rtLow, perf] = await Promise.all([
    getRecentCroSignalSummary(14),
    getRecentRetargetingSignalSummary(14),
    prisma.croLowConversionSnapshot.count(),
    prisma.retargetingLowConversionSnapshot.count(),
    prisma.retargetingPerformanceSnapshot.count(),
  ]);
  return {
    croSignalRows14d: croS.total,
    retargetingSignalRows14d: rtS.total,
    croLowSnapshots: croLow,
    retargetingLowSnapshots: rtLow,
    performanceSnapshots: perf,
    lastCroSignalAt: croS.lastCreatedAt,
    lastRtSignalAt: rtS.lastCreatedAt,
  };
}
