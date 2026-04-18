/**
 * Portfolio optimization runs — audit/logging only; no execution.
 */
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import type { BudgetReallocationRecommendation, PortfolioOptimizationSummary } from "./portfolio-optimization.types";

export type PortfolioOptimizationRunDTO = {
  id: string;
  totalBudget: number;
  reallocatableBudget: number;
  notes: unknown;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
};

export type PortfolioCampaignScoreSnapshotDTO = {
  id: string;
  runId: string | null;
  campaignKey: string;
  portfolioScore: number;
  qualityLabel: string;
  reasons: unknown;
  warnings: unknown;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
};

export type BudgetReallocationRecommendationLogDTO = {
  id: string;
  runId: string | null;
  fromCampaignKey: string | null;
  toCampaignKey: string | null;
  fromAmount: number | null;
  toAmount: number | null;
  amount: number;
  confidenceScore: number;
  reason: string;
  safeguards: unknown;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
};

function metaObj(m: Prisma.JsonValue | null): Record<string, unknown> | null {
  if (m && typeof m === "object" && !Array.isArray(m)) return m as Record<string, unknown>;
  return null;
}

export async function createPortfolioOptimizationRun(input: {
  totalBudget: number;
  reallocatableBudget: number;
  notes?: unknown;
  metadata?: Record<string, unknown> | null;
}): Promise<{ id: string }> {
  const row = await prisma.portfolioOptimizationRun.create({
    data: {
      totalBudget: input.totalBudget,
      reallocatableBudget: input.reallocatableBudget,
      notes: input.notes === undefined ? undefined : (input.notes as Prisma.InputJsonValue),
      metadata: input.metadata ? (input.metadata as Prisma.InputJsonValue) : undefined,
    },
  });
  return { id: row.id };
}

export async function createPortfolioCampaignScoreSnapshots(
  rows: Array<{
    runId?: string | null;
    campaignKey: string;
    portfolioScore: number;
    qualityLabel: string;
    reasons?: unknown;
    warnings?: unknown;
    metadata?: Record<string, unknown> | null;
  }>,
): Promise<{ created: number }> {
  if (rows.length === 0) return { created: 0 };
  await prisma.portfolioCampaignScoreSnapshot.createMany({
    data: rows.map((r) => ({
      runId: r.runId ?? undefined,
      campaignKey: r.campaignKey,
      portfolioScore: r.portfolioScore,
      qualityLabel: r.qualityLabel,
      reasons: r.reasons === undefined ? undefined : (r.reasons as Prisma.InputJsonValue),
      warnings: r.warnings === undefined ? undefined : (r.warnings as Prisma.InputJsonValue),
      metadata: r.metadata ? (r.metadata as Prisma.InputJsonValue) : undefined,
    })),
  });
  return { created: rows.length };
}

export async function createBudgetReallocationRecommendations(
  rows: Array<{
    runId?: string | null;
    fromCampaignKey?: string | null;
    toCampaignKey?: string | null;
    fromAmount?: number | null;
    toAmount?: number | null;
    amount: number;
    confidenceScore: number;
    reason: string;
    safeguards?: unknown;
    metadata?: Record<string, unknown> | null;
  }>,
): Promise<{ created: number }> {
  if (rows.length === 0) return { created: 0 };
  await prisma.budgetReallocationRecommendationLog.createMany({
    data: rows.map((r) => ({
      runId: r.runId ?? undefined,
      fromCampaignKey: r.fromCampaignKey ?? undefined,
      toCampaignKey: r.toCampaignKey ?? undefined,
      fromAmount: r.fromAmount ?? undefined,
      toAmount: r.toAmount ?? undefined,
      amount: r.amount,
      confidenceScore: r.confidenceScore,
      reason: r.reason,
      safeguards: r.safeguards === undefined ? undefined : (r.safeguards as Prisma.InputJsonValue),
      metadata: r.metadata ? (r.metadata as Prisma.InputJsonValue) : undefined,
    })),
  });
  return { created: rows.length };
}

export async function getLatestPortfolioOptimizationRun(): Promise<PortfolioOptimizationRunDTO | null> {
  const r = await prisma.portfolioOptimizationRun.findFirst({
    orderBy: { createdAt: "desc" },
  });
  if (!r) return null;
  return {
    id: r.id,
    totalBudget: r.totalBudget,
    reallocatableBudget: r.reallocatableBudget,
    notes: r.notes,
    metadata: metaObj(r.metadata),
    createdAt: r.createdAt,
  };
}

export async function getRecentPortfolioRecommendations(limit = 20): Promise<BudgetReallocationRecommendationLogDTO[]> {
  const rows = await prisma.budgetReallocationRecommendationLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return rows.map((r) => ({
    id: r.id,
    runId: r.runId,
    fromCampaignKey: r.fromCampaignKey,
    toCampaignKey: r.toCampaignKey,
    fromAmount: r.fromAmount,
    toAmount: r.toAmount,
    amount: r.amount,
    confidenceScore: r.confidenceScore,
    reason: r.reason,
    safeguards: r.safeguards,
    metadata: metaObj(r.metadata),
    createdAt: r.createdAt,
  }));
}

export async function getTopPortfolioCampaigns(limit = 15): Promise<PortfolioCampaignScoreSnapshotDTO[]> {
  const rows = await prisma.portfolioCampaignScoreSnapshot.findMany({
    where: { qualityLabel: { in: ["TOP", "GOOD"] } },
    orderBy: { createdAt: "desc" },
    take: 80,
  });
  const best = new Map<string, (typeof rows)[0]>();
  for (const row of rows) {
    const cur = best.get(row.campaignKey);
    if (!cur || row.portfolioScore > cur.portfolioScore) best.set(row.campaignKey, row);
  }
  return [...best.values()]
    .sort((a, b) => b.portfolioScore - a.portfolioScore)
    .slice(0, limit)
    .map((r) => ({
      id: r.id,
      runId: r.runId,
      campaignKey: r.campaignKey,
      portfolioScore: r.portfolioScore,
      qualityLabel: r.qualityLabel,
      reasons: r.reasons,
      warnings: r.warnings,
      metadata: metaObj(r.metadata),
      createdAt: r.createdAt,
    }));
}

export async function getWeakPortfolioCampaigns(limit = 15): Promise<PortfolioCampaignScoreSnapshotDTO[]> {
  const rows = await prisma.portfolioCampaignScoreSnapshot.findMany({
    where: { qualityLabel: "WEAK" },
    orderBy: { createdAt: "desc" },
    take: 80,
  });
  const worst = new Map<string, (typeof rows)[0]>();
  for (const row of rows) {
    const cur = worst.get(row.campaignKey);
    if (!cur || row.portfolioScore < cur.portfolioScore) worst.set(row.campaignKey, row);
  }
  return [...worst.values()]
    .sort((a, b) => a.portfolioScore - b.portfolioScore)
    .slice(0, limit)
    .map((r) => ({
      id: r.id,
      runId: r.runId,
      campaignKey: r.campaignKey,
      portfolioScore: r.portfolioScore,
      qualityLabel: r.qualityLabel,
      reasons: r.reasons,
      warnings: r.warnings,
      metadata: metaObj(r.metadata),
      createdAt: r.createdAt,
    }));
}

/** Persist a full summary + scores + recs under one run id (optional). */
export async function persistPortfolioOptimizationSnapshot(summary: PortfolioOptimizationSummary): Promise<{ runId: string }> {
  const { id: runId } = await createPortfolioOptimizationRun({
    totalBudget: summary.totalBudget,
    reallocatableBudget: summary.reallocatableBudget,
    notes: summary.notes,
    metadata: { version: "v1" },
  });

  const scoreRows = [...summary.topCampaigns, ...summary.weakCampaigns].map((s) => ({
    runId,
    campaignKey: s.campaignKey,
    portfolioScore: s.portfolioScore,
    qualityLabel: s.qualityLabel,
    reasons: s.reasons,
    warnings: s.warnings,
  }));
  await createPortfolioCampaignScoreSnapshots(scoreRows);

  await createBudgetReallocationRecommendations(
    summary.recommendations.map((r: BudgetReallocationRecommendation) => ({
      runId,
      fromCampaignKey: r.fromCampaignKey,
      toCampaignKey: r.toCampaignKey,
      fromAmount: r.fromAmount,
      toAmount: r.toAmount,
      amount: r.amount,
      confidenceScore: r.confidenceScore,
      reason: r.reason,
      safeguards: r.safeguards,
    })),
  );

  return { runId };
}
