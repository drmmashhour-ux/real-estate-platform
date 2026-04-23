/**
 * Admin dashboard aggregation — Syria-local counts only.
 */

import { prisma } from "@/lib/db";
import { buildMarketplaceOptimizationSummary } from "./darlink-optimization-summary.service";
import { buildMarketplaceOutcomeFeedback } from "./darlink-outcome-feedback.service";
import { buildMarketplaceSnapshot } from "./darlink-marketplace-snapshot.service";
import { buildMarketplaceSignals } from "./darlink-signal-builder.service";

export async function buildMarketplaceAutonomyDashboard(): Promise<{
  ok: boolean;
  freshness: string;
  totals: {
    signals: number;
    opportunitiesProxy: number;
    actionsExecuted: number;
    actionsDryRunOrBlocked: number;
    pendingApprovals: number;
    auditRows24h: number;
    rollbackEvents30d: number;
  };
  riskyListings: { id: string; fraudFlag: boolean }[];
  optimization: ReturnType<typeof buildMarketplaceOptimizationSummary>;
  feedbackPreview: Awaited<ReturnType<typeof buildMarketplaceOutcomeFeedback>> | null;
  notes: readonly string[];
}> {
  const notes: string[] = [];
  const freshness = new Date().toISOString();

  try {
    const since24h = new Date(Date.now() - 86400000);
    const since30d = new Date(Date.now() - 30 * 86400000);

    const [
      pendingApprovals,
      executedRows,
      auditRows24h,
      flaggedListings,
      rollbackRows,
    ] = await Promise.all([
      prisma.syriaMarketplaceAutonomyApproval.count({ where: { status: "PENDING" } }).catch(() => 0),
      prisma.syriaMarketplaceAutonomyActionRecord.count({ where: { outcome: "EXECUTED" } }).catch(() => 0),
      prisma.syriaMarketplaceAutonomyAuditLog.count({ where: { createdAt: { gte: since24h } } }).catch(() => 0),
      prisma.syriaProperty
        .findMany({
          where: { fraudFlag: true },
          take: 15,
          select: { id: true, fraudFlag: true },
        })
        .catch(() => []),
      prisma.syriaMarketplaceAutonomyAuditLog
        .count({
          where: {
            createdAt: { gte: since30d },
            eventType: "autonomy_action_rolled_back",
          },
        })
        .catch(() => 0),
    ]);

    const snapshot = await buildMarketplaceSnapshot({ portfolio: true });
    const signals = buildMarketplaceSignals(snapshot);

    let feedbackPreview: Awaited<ReturnType<typeof buildMarketplaceOutcomeFeedback>> | null = null;
    try {
      feedbackPreview = await buildMarketplaceOutcomeFeedback({
        snapshot,
        signals,
        proposalsExecuted: executedRows,
        proposalsBlocked: 0,
      });
    } catch {
      feedbackPreview = null;
    }

    const optimization = buildMarketplaceOptimizationSummary({
      signals,
      feedback: feedbackPreview,
    });

    const dryRunLike = await prisma.syriaMarketplaceAutonomyActionRecord
      .count({
        where: { outcome: { in: ["DRY_RUN", "BLOCKED"] } },
      })
      .catch(() => 0);

    return {
      ok: true,
      freshness,
      totals: {
        signals: signals.length,
        opportunitiesProxy: Math.min(signals.length * 2, 160),
        actionsExecuted: executedRows,
        actionsDryRunOrBlocked: dryRunLike,
        pendingApprovals,
        auditRows24h,
        rollbackEvents30d: rollbackRows,
      },
      riskyListings: flaggedListings.map((x) => ({ id: x.id, fraudFlag: x.fraudFlag })),
      optimization,
      feedbackPreview,
      notes,
    };
  } catch {
    return {
      ok: false,
      freshness,
      totals: {
        signals: 0,
        opportunitiesProxy: 0,
        actionsExecuted: 0,
        actionsDryRunOrBlocked: 0,
        pendingApprovals: 0,
        auditRows24h: 0,
        rollbackEvents30d: 0,
      },
      riskyListings: [],
      optimization: buildMarketplaceOptimizationSummary({ signals: [], feedback: null }),
      feedbackPreview: null,
      notes: ["dashboard_aggregate_failed"],
    };
  }
}
