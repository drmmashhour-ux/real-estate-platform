/**
 * DB persistence for ads automation V4 — returns app DTOs, not raw Prisma models.
 */

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type {
  AdsAutomationLoopRunRecord,
  PersistentLearningSnapshot,
  PersistedCampaignClassification,
  PersistedLandingInsight,
  PersistedRecommendation,
} from "./ads-automation-v4.types";

function asRecord(j: unknown): Record<string, unknown> {
  return j && typeof j === "object" && !Array.isArray(j) ? (j as Record<string, unknown>) : {};
}

export async function createLoopRun(input: {
  windowDays: number;
  aggregateInput: Record<string, unknown>;
  aggregateFunnel: Record<string, unknown>;
  winnersCount: number;
  weakCount: number;
  uncertainCount: number;
  recommendationCount: number;
  confidence: number | null;
  summary: string | null;
  why: string | null;
  featureFlagsSnapshot?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
}): Promise<{ id: string }> {
  const row = await prisma.adsAutomationLoopRun.create({
    data: {
      windowDays: input.windowDays,
      aggregateInput: input.aggregateInput as Prisma.InputJsonValue,
      aggregateFunnel: input.aggregateFunnel as Prisma.InputJsonValue,
      winnersCount: input.winnersCount,
      weakCount: input.weakCount,
      uncertainCount: input.uncertainCount,
      recommendationCount: input.recommendationCount,
      confidence: input.confidence ?? undefined,
      summary: input.summary ?? undefined,
      why: input.why ?? undefined,
      featureFlagsSnapshot: (input.featureFlagsSnapshot ?? undefined) as Prisma.InputJsonValue | undefined,
      metadata: (input.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
    },
    select: { id: true },
  });
  return { id: row.id };
}

export async function saveCampaignResults(
  loopRunId: string,
  rows: Array<{
    campaignKey: string;
    campaignLabel?: string | null;
    classification: string;
    confidence: number | null;
    impressions: number;
    clicks: number;
    leads: number;
    bookingsStarted: number;
    bookingsCompleted: number;
    spend: number | null;
    ctr: number | null;
    cpl: number | null;
    conversionRate: number | null;
    geoSummary?: unknown;
    evidence?: unknown;
  }>,
): Promise<void> {
  if (rows.length === 0) return;
  await prisma.adsAutomationCampaignResult.createMany({
    data: rows.map((r) => ({
      loopRunId,
      campaignKey: r.campaignKey,
      campaignLabel: r.campaignLabel ?? undefined,
      classification: r.classification,
      confidence: r.confidence ?? undefined,
      impressions: r.impressions,
      clicks: r.clicks,
      leads: r.leads,
      bookingsStarted: r.bookingsStarted,
      bookingsCompleted: r.bookingsCompleted,
      spend: r.spend ?? undefined,
      ctr: r.ctr ?? undefined,
      cpl: r.cpl ?? undefined,
      conversionRate: r.conversionRate ?? undefined,
      geoSummary: r.geoSummary as Prisma.InputJsonValue | undefined,
      evidence: r.evidence as Prisma.InputJsonValue | undefined,
    })),
  });
}

export async function saveRecommendations(
  loopRunId: string,
  rows: Array<{
    recommendationType: string;
    targetKey?: string | null;
    targetLabel?: string | null;
    priority?: string | null;
    confidence: number | null;
    evidenceScore: number | null;
    reasons?: unknown;
    operatorAction?: string | null;
    metadata?: unknown;
  }>,
): Promise<void> {
  if (rows.length === 0) return;
  await prisma.adsAutomationRecommendation.createMany({
    data: rows.map((r) => ({
      loopRunId,
      recommendationType: r.recommendationType,
      targetKey: r.targetKey ?? undefined,
      targetLabel: r.targetLabel ?? undefined,
      priority: r.priority ?? undefined,
      confidence: r.confidence ?? undefined,
      evidenceScore: r.evidenceScore ?? undefined,
      reasons: r.reasons as Prisma.InputJsonValue | undefined,
      operatorAction: r.operatorAction ?? undefined,
      metadata: r.metadata as Prisma.InputJsonValue | undefined,
    })),
  });
}

export async function saveLandingInsights(
  loopRunId: string,
  rows: Array<{
    segment?: string | null;
    issueType: string;
    severity?: string | null;
    confidence: number | null;
    evidenceScore?: number | null;
    views: number;
    clicks: number;
    leads: number;
    bookings: number;
    reasons?: unknown;
    recommendations?: unknown;
  }>,
): Promise<void> {
  if (rows.length === 0) return;
  await prisma.adsAutomationLandingInsight.createMany({
    data: rows.map((r) => ({
      loopRunId,
      segment: r.segment ?? undefined,
      issueType: r.issueType,
      severity: r.severity ?? undefined,
      confidence: r.confidence ?? undefined,
      evidenceScore: r.evidenceScore ?? undefined,
      views: r.views,
      clicks: r.clicks,
      leads: r.leads,
      bookings: r.bookings,
      reasons: r.reasons as Prisma.InputJsonValue | undefined,
      recommendations: r.recommendations as Prisma.InputJsonValue | undefined,
    })),
  });
}

export function mapAdsAutomationLoopRunRow(row: {
  id: string;
  windowDays: number;
  aggregateInput: unknown;
  aggregateFunnel: unknown;
  winnersCount: number;
  weakCount: number;
  uncertainCount: number;
  recommendationCount: number;
  confidence: number | null;
  summary: string | null;
  why: string | null;
  featureFlagsSnapshot: unknown;
  metadata: unknown;
  createdAt: Date;
}): AdsAutomationLoopRunRecord {
  return {
    id: row.id,
    windowDays: row.windowDays,
    aggregateInput: asRecord(row.aggregateInput),
    aggregateFunnel: asRecord(row.aggregateFunnel),
    winnersCount: row.winnersCount,
    weakCount: row.weakCount,
    uncertainCount: row.uncertainCount,
    recommendationCount: row.recommendationCount,
    confidence: row.confidence,
    summary: row.summary,
    why: row.why,
    featureFlagsSnapshot: row.featureFlagsSnapshot ? asRecord(row.featureFlagsSnapshot) : null,
    metadata: row.metadata ? asRecord(row.metadata) : null,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function getLatestLoopRun(): Promise<AdsAutomationLoopRunRecord | null> {
  const row = await prisma.adsAutomationLoopRun.findFirst({
    orderBy: { createdAt: "desc" },
  });
  return row ? mapAdsAutomationLoopRunRow(row) : null;
}

export async function getLoopRunHistory(limit = 20): Promise<AdsAutomationLoopRunRecord[]> {
  const rows = await prisma.adsAutomationLoopRun.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return rows.map(mapAdsAutomationLoopRunRow);
}

export async function getLoopRunById(id: string): Promise<AdsAutomationLoopRunRecord | null> {
  const row = await prisma.adsAutomationLoopRun.findUnique({ where: { id } });
  return row ? mapAdsAutomationLoopRunRow(row) : null;
}

export type PatternUpsert = {
  patternType: string;
  patternKey: string;
  sentiment: string;
  score: number;
  supportCount: number;
  winCount: number;
  weakCount: number;
  uncertainCount: number;
  lastSeenAt?: Date | null;
  metadata?: unknown;
};

export async function upsertLearningPatternSnapshots(patterns: PatternUpsert[]): Promise<void> {
  for (const p of patterns) {
    await prisma.adsLearningPatternSnapshot.upsert({
      where: {
        patternType_patternKey_sentiment: {
          patternType: p.patternType,
          patternKey: p.patternKey,
          sentiment: p.sentiment,
        },
      },
      create: {
        patternType: p.patternType,
        patternKey: p.patternKey,
        sentiment: p.sentiment,
        score: p.score,
        supportCount: p.supportCount,
        winCount: p.winCount,
        weakCount: p.weakCount,
        uncertainCount: p.uncertainCount,
        lastSeenAt: p.lastSeenAt ?? new Date(),
        metadata: p.metadata as Prisma.InputJsonValue | undefined,
      },
      update: {
        score: p.score,
        supportCount: p.supportCount,
        winCount: p.winCount,
        weakCount: p.weakCount,
        uncertainCount: p.uncertainCount,
        lastSeenAt: p.lastSeenAt ?? new Date(),
        metadata: p.metadata as Prisma.InputJsonValue | undefined,
      },
    });
  }
}

export type CampaignMemoryUpsert = {
  campaignKey: string;
  campaignLabel?: string | null;
  primaryObjective?: string | null;
  bestHooks?: unknown;
  weakHooks?: unknown;
  bestCtas?: unknown;
  weakCtas?: unknown;
  bestAudiences?: unknown;
  weakAudiences?: unknown;
  geoInsights?: unknown;
  metadata?: unknown;
  lastClassifiedAt?: Date | null;
};

export async function upsertCampaignMemory(rows: CampaignMemoryUpsert[]): Promise<void> {
  for (const r of rows) {
    await prisma.adsLearningCampaignMemory.upsert({
      where: { campaignKey: r.campaignKey },
      create: {
        campaignKey: r.campaignKey,
        campaignLabel: r.campaignLabel ?? undefined,
        primaryObjective: r.primaryObjective ?? undefined,
        bestHooks: r.bestHooks as Prisma.InputJsonValue | undefined,
        weakHooks: r.weakHooks as Prisma.InputJsonValue | undefined,
        bestCtas: r.bestCtas as Prisma.InputJsonValue | undefined,
        weakCtas: r.weakCtas as Prisma.InputJsonValue | undefined,
        bestAudiences: r.bestAudiences as Prisma.InputJsonValue | undefined,
        weakAudiences: r.weakAudiences as Prisma.InputJsonValue | undefined,
        geoInsights: r.geoInsights as Prisma.InputJsonValue | undefined,
        metadata: r.metadata as Prisma.InputJsonValue | undefined,
        lastClassifiedAt: r.lastClassifiedAt ?? new Date(),
      },
      update: {
        campaignLabel: r.campaignLabel ?? undefined,
        primaryObjective: r.primaryObjective ?? undefined,
        bestHooks: r.bestHooks as Prisma.InputJsonValue | undefined,
        weakHooks: r.weakHooks as Prisma.InputJsonValue | undefined,
        bestCtas: r.bestCtas as Prisma.InputJsonValue | undefined,
        weakCtas: r.weakCtas as Prisma.InputJsonValue | undefined,
        bestAudiences: r.bestAudiences as Prisma.InputJsonValue | undefined,
        weakAudiences: r.weakAudiences as Prisma.InputJsonValue | undefined,
        geoInsights: r.geoInsights as Prisma.InputJsonValue | undefined,
        metadata: r.metadata as Prisma.InputJsonValue | undefined,
        lastClassifiedAt: r.lastClassifiedAt ?? new Date(),
      },
    });
  }
}

export async function getLearningSnapshot(): Promise<PersistentLearningSnapshot> {
  const [patterns, campaignMemories] = await Promise.all([
    prisma.adsLearningPatternSnapshot.findMany({
      orderBy: { updatedAt: "desc" },
      take: 500,
    }),
    prisma.adsLearningCampaignMemory.findMany({
      orderBy: { updatedAt: "desc" },
      take: 200,
    }),
  ]);

  return {
    patterns: patterns.map((p) => ({
      patternType: p.patternType,
      patternKey: p.patternKey,
      sentiment: p.sentiment,
      score: p.score,
      supportCount: p.supportCount,
      winCount: p.winCount,
      weakCount: p.weakCount,
      uncertainCount: p.uncertainCount,
      lastSeenAt: p.lastSeenAt?.toISOString() ?? null,
    })),
    campaignMemories: campaignMemories.map((c) => ({
      campaignKey: c.campaignKey,
      campaignLabel: c.campaignLabel,
      primaryObjective: c.primaryObjective,
      updatedAt: c.updatedAt.toISOString(),
    })),
  };
}

export async function getCampaignMemory(campaignKey: string) {
  return prisma.adsLearningCampaignMemory.findUnique({ where: { campaignKey } });
}

export async function getTopLearningPatternsByType(patternType: string, limit = 24) {
  return prisma.adsLearningPatternSnapshot.findMany({
    where: { patternType },
    orderBy: { score: "desc" },
    take: limit,
  });
}

export type LoopPatternDelta = {
  patternType: string;
  patternKey: string;
  sentiment: string;
  incrementWin?: number;
  incrementWeak?: number;
  incrementUncertain?: number;
};

/** Incremental pattern counters after each loop — safe to call with small deltas. */
export async function incrementLoopPatternDeltas(deltas: LoopPatternDelta[]): Promise<void> {
  const now = new Date();
  for (const d of deltas) {
    const iw = d.incrementWin ?? 0;
    const iwk = d.incrementWeak ?? 0;
    const iu = d.incrementUncertain ?? 0;
    const total = iw + iwk + iu;
    if (total <= 0) continue;

    await prisma.adsLearningPatternSnapshot.upsert({
      where: {
        patternType_patternKey_sentiment: {
          patternType: d.patternType,
          patternKey: d.patternKey,
          sentiment: d.sentiment,
        },
      },
      create: {
        patternType: d.patternType,
        patternKey: d.patternKey,
        sentiment: d.sentiment,
        score: Math.min(1, 0.25 + Math.min(1, iw * 0.15)),
        supportCount: total,
        winCount: iw,
        weakCount: iwk,
        uncertainCount: iu,
        lastSeenAt: now,
      },
      update: {
        supportCount: { increment: total },
        winCount: { increment: iw },
        weakCount: { increment: iwk },
        uncertainCount: { increment: iu },
        lastSeenAt: now,
      },
    });
  }
}
