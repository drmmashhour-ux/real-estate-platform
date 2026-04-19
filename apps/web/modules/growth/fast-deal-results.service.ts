/**
 * Fast Deal results — persistence + deterministic summary (measurement only).
 */

import { prisma } from "@/lib/db";
import { engineFlags } from "@/config/feature-flags";
import type {
  FastDealSourceType,
  FastDealSummary,
} from "@/modules/growth/fast-deal-results.types";
import {
  aggregateLanding,
  aggregateOutcomeBuckets,
  aggregatePlaybook,
  aggregateSourcing,
  computeSparseSummary,
} from "@/modules/growth/fast-deal-results-aggregate";
import { generateFastDealInsights } from "@/modules/growth/fast-deal-insights.service";
import {
  monitorFastDealOutcomeLogged,
  monitorFastDealSourceEventLogged,
  monitorFastDealSparseData,
  monitorFastDealSummaryBuilt,
} from "@/modules/growth/fast-deal-results-monitoring.service";

const TAKE = 800;

export async function recordFastDealSourceEvent(input: {
  sourceType: FastDealSourceType;
  sourceSubType: string;
  metadata?: Record<string, unknown>;
  /** Optional actor user id — stored only in metadata to avoid FK churn. */
  actorUserId?: string | null;
}): Promise<{ id: string } | null> {
  if (!engineFlags.fastDealResultsV1) return null;
  try {
    const merged = {
      ...(input.metadata ?? {}),
      ...(input.actorUserId ? { actorUserId: input.actorUserId } : {}),
    };
    const row = await prisma.fastDealSourceEvent.create({
      data: {
        sourceType: input.sourceType,
        sourceSubType: input.sourceSubType,
        metadataJson: Object.keys(merged).length ? (merged as object) : undefined,
      },
    });
    monitorFastDealSourceEventLogged({
      sourceType: input.sourceType,
      sourceSubType: input.sourceSubType,
      id: row.id,
    });
    return { id: row.id };
  } catch {
    return null;
  }
}

export async function recordFastDealOutcome(input: {
  outcomeType: string;
  sourceEventId?: string | null;
  leadId?: string | null;
  brokerId?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<{ id: string } | null> {
  if (!engineFlags.fastDealResultsV1) return null;
  try {
    const row = await prisma.fastDealOutcome.create({
      data: {
        outcomeType: input.outcomeType,
        sourceEventId: input.sourceEventId ?? undefined,
        leadId: input.leadId ?? undefined,
        brokerId: input.brokerId ?? undefined,
        metadataJson: input.metadata ? (input.metadata as object) : undefined,
      },
    });
    monitorFastDealOutcomeLogged({ outcomeType: input.outcomeType, id: row.id });
    return { id: row.id };
  } catch {
    return null;
  }
}

export async function buildFastDealSummary(): Promise<FastDealSummary | null> {
  if (!engineFlags.fastDealResultsV1) return null;

  const [sourceRows, outcomeRows] = await Promise.all([
    prisma.fastDealSourceEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: TAKE,
      select: { sourceType: true, sourceSubType: true, metadataJson: true },
    }),
    prisma.fastDealOutcome.findMany({
      orderBy: { createdAt: "desc" },
      take: TAKE,
      select: { outcomeType: true },
    }),
  ]);

  const sourcingUsage = aggregateSourcing(sourceRows);
  const landingPerformance = aggregateLanding(sourceRows);
  const playbookProgress = aggregatePlaybook(sourceRows);
  const outcomes = aggregateOutcomeBuckets(outcomeRows);

  const sparse = computeSparseSummary(sourceRows.length, outcomeRows.length);
  if (sparse.level !== "ok") {
    monitorFastDealSparseData({
      reason: sparse.level,
      totals: sourceRows.length + outcomeRows.length,
    });
  }

  const leadCaptured = outcomeRows.filter((o) => o.outcomeType === "lead_captured").length;
  const progressed = outcomeRows.filter((o) => o.outcomeType === "deal_progressed").length;
  const closed = outcomeRows.filter((o) => o.outcomeType === "deal_closed").length;

  const insights = generateFastDealInsights({
    sourcing: sourcingUsage,
    landing: landingPerformance,
    playbook: playbookProgress,
    outcomeTotals: { leadCaptured, progressed, closed },
    sparse,
  });

  monitorFastDealSummaryBuilt({
    sourceEvents: sourceRows.length,
    outcomes: outcomeRows.length,
    sparseLevel: sparse.level,
  });

  return {
    sourcingUsage,
    landingPerformance,
    playbookProgress,
    outcomes,
    insights,
    sparse,
    generatedAt: new Date().toISOString(),
  };
}
