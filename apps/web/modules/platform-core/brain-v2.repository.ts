/**
 * LECIPM PLATFORM — One Brain V2 persistence (DTOs only; no raw Prisma leakage to UI).
 */
import { prisma } from "@/lib/db";
import type { BrainLearningSource, BrainOutcomeRecord, BrainSourceWeight } from "./brain-v2.types";
import { getDefaultBrainSourceWeights } from "./brain-weight-adaptation.service";

export type BrainDecisionOutcomeDTO = {
  id: string;
  decisionId: string;
  source: BrainLearningSource;
  entityType: string;
  entityId: string | null;
  actionType: string;
  outcomeType: string;
  outcomeScore: number;
  observedMetrics: Record<string, unknown> | null;
  reason: string;
  createdAt: Date;
};

export type BrainLearningRunDTO = {
  id: string;
  sourceCount: number;
  decisionCount: number;
  notes: unknown;
  metadata: unknown;
  createdAt: Date;
};

function assertLearningSource(s: string): asserts s is BrainLearningSource {
  const ok = ["ADS", "CRO", "RETARGETING", "AB_TEST", "PROFIT", "MARKETPLACE", "UNIFIED"].includes(s);
  if (!ok) throw new Error(`brain-v2.repository: invalid learning source "${s}"`);
}

function rowToOutcome(r: {
  id: string;
  decisionId: string;
  source: string;
  entityType: string;
  entityId: string | null;
  actionType: string;
  outcomeType: string;
  outcomeScore: number;
  observedMetrics: unknown;
  reason: string;
  createdAt: Date;
}): BrainDecisionOutcomeDTO {
  assertLearningSource(r.source);
  return {
    id: r.id,
    decisionId: r.decisionId,
    source: r.source,
    entityType: r.entityType,
    entityId: r.entityId,
    actionType: r.actionType,
    outcomeType: r.outcomeType,
    outcomeScore: r.outcomeScore,
    observedMetrics:
      r.observedMetrics && typeof r.observedMetrics === "object" && !Array.isArray(r.observedMetrics) ?
        (r.observedMetrics as Record<string, unknown>)
      : null,
    reason: r.reason,
    createdAt: r.createdAt,
  };
}

function rowToWeight(r: {
  source: string;
  weight: number;
  confidence: number;
  sampleCount: number;
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  updatedAt: Date;
}): BrainSourceWeight {
  assertLearningSource(r.source);
  return {
    source: r.source,
    weight: r.weight,
    confidence: r.confidence,
    sampleCount: r.sampleCount,
    positiveCount: r.positiveCount,
    negativeCount: r.negativeCount,
    neutralCount: r.neutralCount,
    lastLearnedAt: r.updatedAt.toISOString(),
  };
}

/** Merge persisted rows with defaults so every source exists. */
export async function getCurrentSourceWeights(): Promise<BrainSourceWeight[]> {
  const rows = await prisma.brainSourceWeightSnapshot.findMany();
  const defaults = getDefaultBrainSourceWeights();
  const bySource = new Map(rows.map((x) => [x.source, x]));
  return defaults.map((d) => {
    const row = bySource.get(d.source);
    return row ? rowToWeight(row) : d;
  });
}

export async function upsertSourceWeights(weights: BrainSourceWeight[]): Promise<void> {
  for (const w of weights) {
    await prisma.brainSourceWeightSnapshot.upsert({
      where: { source: w.source },
      create: {
        source: w.source,
        weight: w.weight,
        confidence: w.confidence,
        sampleCount: w.sampleCount,
        positiveCount: w.positiveCount,
        negativeCount: w.negativeCount,
        neutralCount: w.neutralCount,
        metadata: { lastLearnedAt: w.lastLearnedAt ?? null },
      },
      update: {
        weight: w.weight,
        confidence: w.confidence,
        sampleCount: w.sampleCount,
        positiveCount: w.positiveCount,
        negativeCount: w.negativeCount,
        neutralCount: w.neutralCount,
        metadata: { lastLearnedAt: w.lastLearnedAt ?? null },
      },
    });
  }
}

export async function createDecisionOutcomes(outcomes: BrainOutcomeRecord[]): Promise<{ created: number; skipped: number }> {
  let created = 0;
  let skipped = 0;
  for (const o of outcomes) {
    const existing = await prisma.brainDecisionOutcome.findFirst({
      where: {
        decisionId: o.decisionId,
        outcomeType: o.outcomeType,
        outcomeScore: o.outcomeScore,
      },
    });
    if (existing) {
      skipped += 1;
      continue;
    }
    await prisma.brainDecisionOutcome.create({
      data: {
        decisionId: o.decisionId,
        source: o.source,
        entityType: o.entityType,
        entityId: o.entityId ?? undefined,
        actionType: o.actionType,
        outcomeType: o.outcomeType,
        outcomeScore: o.outcomeScore,
        observedMetrics: o.observedMetrics as object | undefined,
        reason: o.reason,
      },
    });
    created += 1;
  }
  return { created, skipped };
}

export async function listDecisionOutcomes(filters?: {
  source?: BrainLearningSource;
  limit?: number;
  since?: Date;
  /** Strictly after this instant (avoids re-processing rows at the same timestamp as a learning run). */
  after?: Date;
}): Promise<BrainDecisionOutcomeDTO[]> {
  const limit = filters?.limit ?? 200;
  const rows = await prisma.brainDecisionOutcome.findMany({
    where: {
      ...(filters?.source ? { source: filters.source } : {}),
      ...(filters?.after ? { createdAt: { gt: filters.after } } : {}),
      ...(!filters?.after && filters?.since ? { createdAt: { gte: filters.since } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return rows.map(rowToOutcome);
}

export async function createLearningRun(input: {
  sourceCount: number;
  decisionCount: number;
  notes?: unknown;
  metadata?: unknown;
}): Promise<BrainLearningRunDTO> {
  const row = await prisma.brainLearningRun.create({
    data: {
      sourceCount: input.sourceCount,
      decisionCount: input.decisionCount,
      notes: input.notes as object | undefined,
      metadata: input.metadata as object | undefined,
    },
  });
  return {
    id: row.id,
    sourceCount: row.sourceCount,
    decisionCount: row.decisionCount,
    notes: row.notes,
    metadata: row.metadata,
    createdAt: row.createdAt,
  };
}

export async function getLatestLearningSnapshot(): Promise<BrainLearningRunDTO | null> {
  const row = await prisma.brainLearningRun.findFirst({ orderBy: { createdAt: "desc" } });
  if (!row) return null;
  return {
    id: row.id,
    sourceCount: row.sourceCount,
    decisionCount: row.decisionCount,
    notes: row.notes,
    metadata: row.metadata,
    createdAt: row.createdAt,
  };
}

export async function getOutcomesForSource(source: BrainLearningSource, limit = 80): Promise<BrainDecisionOutcomeDTO[]> {
  const rows = await prisma.brainDecisionOutcome.findMany({
    where: { source },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return rows.map(rowToOutcome);
}

export async function getDecisionOutcomeByDecisionId(decisionId: string): Promise<BrainDecisionOutcomeDTO[]> {
  const rows = await prisma.brainDecisionOutcome.findMany({
    where: { decisionId },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(rowToOutcome);
}
