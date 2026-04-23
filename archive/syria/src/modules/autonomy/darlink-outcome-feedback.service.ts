/**
 * Deterministic funnel ratios from aggregates — recommendation-only feedback.
 */

import type { DarlinkMarketplaceSnapshot } from "./darlink-marketplace-autonomy.types";
import type { MarketplaceOutcomeFeedback } from "./darlink-marketplace-autonomy.types";
import type { MarketplaceSignal } from "./darlink-marketplace-autonomy.types";
import { prisma } from "@/lib/db";
import { persistAutonomyAuditEvent } from "./darlink-autonomy-persistence.service";
import { DarlinkAutonomyAuditEvent } from "./darlink-autonomy-audit.types";

export async function buildMarketplaceOutcomeFeedback(params: {
  snapshot: DarlinkMarketplaceSnapshot;
  signals: MarketplaceSignal[];
  proposalsExecuted: number;
  proposalsBlocked: number;
  /** Default false — orchestrator/run sets true when persisting feedback is intended. */
  persist?: boolean;
}): Promise<MarketplaceOutcomeFeedback> {
  const now = new Date();
  const periodEnd = now.toISOString();
  const periodStart = new Date(now.getTime() - 30 * 86400000).toISOString();

  try {
    const leads = params.snapshot.aggregates.inquiriesLast30d;
    const views = params.snapshot.growthMetrics
      ? (params.snapshot.growthMetrics.eventsByType["listing_view"] ?? 0) +
        (params.snapshot.growthMetrics.eventsByType["listing_detail_view"] ?? 0)
      : 0;
    const bookings = params.snapshot.aggregates.totalBookings;

    const viewsToLeadsRatio =
      views > 0 ? Math.round((leads / views) * 1000) / 1000 : leads > 0 ? null : null;
    const leadsToBookingsRatio =
      leads > 0 ? Math.round((bookings / Math.max(leads, 1)) * 1000) / 1000 : null;

    const execTotal = params.proposalsExecuted + params.proposalsBlocked;
    const executedActionSuccessRate =
      execTotal > 0 ? Math.round((params.proposalsExecuted / execTotal) * 1000) / 1000 : null;

    const trustRiskFlagsCount = params.signals.filter((s) => s.type === "trust_risk" || s.type === "fraud_risk").length;

    const rollup: MarketplaceOutcomeFeedback = {
      periodStart,
      periodEnd,
      viewsToLeadsRatio,
      leadsToBookingsRatio,
      listingQualityDeltaHint: null,
      trustRiskFlagsCount,
      executedActionSuccessRate,
      notes: [
        "aggregate_window_30d",
        "ratios_are_proxies_not_causal",
      ],
    };

    const persist = params.persist === true;
    if (persist) {
      await persistAutonomyAuditEvent({
        eventType: DarlinkAutonomyAuditEvent.FEEDBACK_RECORDED,
        payload: { rollup } as Record<string, unknown>,
      });

      try {
        await prisma.syriaMarketplaceOutcomeFeedbackRollup.create({
          data: {
            periodStart: new Date(periodStart),
            periodEnd: new Date(periodEnd),
            rollupJson: rollup as object,
          },
        });
      } catch {
        /* optional table */
      }
    }

    return rollup;
  } catch {
    return {
      periodStart,
      periodEnd,
      viewsToLeadsRatio: null,
      leadsToBookingsRatio: null,
      listingQualityDeltaHint: null,
      trustRiskFlagsCount: 0,
      executedActionSuccessRate: null,
      notes: ["feedback_build_failed_safe"],
    };
  }
}
